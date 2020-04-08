package hndlrs

import (
	"graphelier/core/graphelier-service/db"
	"graphelier/core/graphelier-service/models"
	"net"
	"net/http"
	"strconv"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// SocketConn : Indirection layer for access to websocket.Conn
type SocketConn interface {
	RemoteAddr() net.Addr
	WriteJSON(interface{}) error
	ReadMessage() (int, []byte, error)
	Close() error
}

// PlaybackSession : Handles lifetime of a playback session with the client over a websocket connection
type PlaybackSession struct {
	Socket    SocketConn
	Orderbook *models.Orderbook
	Delay     uint64
	Loader    MessageLoader
	messages  chan []*models.Message
	realtime  time.Time
	running   bool
}

// MessageLoader : Interface for asynchronous retrieval of messages, each call to LoadMessages should be stateful and move the bounds
type MessageLoader interface {
	LoadMessages()
	Init(*models.Orderbook, chan []*models.Message)
}

// TimeIntervalLoader : Loads messages by time intervals
type TimeIntervalLoader struct {
	Instrument       string
	Datastore        db.Datastore
	Interval         uint64
	messages         chan []*models.Message
	currentTimestamp uint64
}

// CountIntervalLoader : Loads messages by regular count intervals
type CountIntervalLoader struct {
	Instrument  string
	Datastore   db.Datastore
	Count       uint64
	messages    chan []*models.Message
	currentPage models.Paginator
}

var upgrader = websocket.Upgrader{}

// StreamPlayback : Initiates a websocket connection and starts streaming order book modifications for playback
func StreamPlayback(env *Env, w http.ResponseWriter, r *http.Request) error {
	getParams := r.URL.Query()
	delay, err := strconv.ParseFloat(getParams.Get("delay"), 64)
	if err != nil {
		delay = 0.5
	}
	delay *= 1e9
	params := mux.Vars(r)
	instrument := params["instrument"]
	startTimestamp, err := strconv.ParseUint(params["timestamp"], 10, 64)
	if err != nil {
		return StatusError{400, err}
	}
	var loader MessageLoader
	rateMessages, mErr := strconv.ParseUint(getParams.Get("rateMessages"), 10, 64)
	rateRealtime, tErr := strconv.ParseFloat(getParams.Get("rateRealtime"), 64)
	switch {
	case mErr == nil && tErr != nil:
		loader = &CountIntervalLoader{Instrument: instrument, Datastore: env.Datastore, Count: rateMessages}
	case tErr == nil && mErr != nil:
		loader = &TimeIntervalLoader{Instrument: instrument, Datastore: env.Datastore, Interval: uint64(delay * rateRealtime)}
	default:
		return StatusError{400, ParamError{"One of rateMessages or rateRealtime must be provided"}}
	}

	session := PlaybackSession{Delay: uint64(delay), Loader: loader}
	err = session.LoadOrderBook(env.Datastore, instrument, startTimestamp)
	if err != nil {
		return StatusError{500, err}
	}

	err = session.InitSocket(w, r)
	if err != nil {
		return nil
	}
	defer session.Close()
	log.Infof("Established socket connection with %s for playback\n", session.Socket.RemoteAddr())

	err = session.Start() // Blocks until session is done
	if err != nil {
		log.Errorf("Error during playback session: %s\n", err)
		return nil
	}

	return nil
}

// Start : streams modifications to the client until a close message is received
func (pb *PlaybackSession) Start() error {
	pb.realtime = time.Now()
	pb.running = true
	go pb.handleSocketControl()
	return pb.handleStreaming()
}

// generates modifications from messages and sends data to the client at regular intervals
func (pb *PlaybackSession) handleStreaming() error {
	go pb.Loader.LoadMessages()
	for pb.running {
		messages, ok := <-pb.messages
		if !ok {
			log.Debugln("Stopping playback session")
			break
		}
		go pb.Loader.LoadMessages()
		log.Tracef("Got %d messages\n", len(messages))
		modifications := pb.Orderbook.YieldModifications(messages)
		log.Tracef("Generated %d modifications\n", len(modifications.Modifications))

		err := pb.Socket.WriteJSON(modifications)
		if err != nil {
			return err
		}

		pb.realtime = pb.realtime.Add(time.Duration(pb.Delay))
		log.Debugf("Sleeping for %v\n", time.Until(pb.realtime))
		<-time.After(time.Until(pb.realtime))
	}
	pb.running = false
	return nil
}

// receive messages from the client and aborts the session on close
func (pb *PlaybackSession) handleSocketControl() {
	for pb.running {
		sockMsgType, _, err := pb.Socket.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseNoStatusReceived, websocket.CloseGoingAway) {
				log.Errorf("Unexpected error while waiting for input: %v\n", err)
			}
			pb.running = false
		}
		switch sockMsgType {
		case websocket.CloseMessage:
			log.Infof("Terminating playback session with %s\n", pb.Socket.RemoteAddr())
			pb.running = false
		}
	}
}

// InitSocket : Upgrades the http request to a websocket connection
func (pb *PlaybackSession) InitSocket(w http.ResponseWriter, r *http.Request) error {
	socket, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Errorf("Failed to open socket connection: %s\n", err)
		return err
	}
	pb.Socket = socket
	return nil
}

// LoadOrderBook : Establishes the initial state for the playback session
func (pb *PlaybackSession) LoadOrderBook(db db.Datastore, instrument string, startTimestamp uint64) error {
	orderbook, err := db.GetOrderbook(instrument, startTimestamp)
	if err != nil {
		return err
	}
	messages, err := db.GetMessagesByTimestamp(instrument, startTimestamp)
	if err != nil {
		return err
	}
	orderbook.ApplyMessagesToOrderbook(messages)
	log.Tracef("Loaded initial state for playback at %d\n", orderbook.Timestamp)
	pb.Orderbook = orderbook
	pb.messages = make(chan []*models.Message, 1)
	pb.Loader.Init(pb.Orderbook, pb.messages)
	return nil
}

// Close : Tears down the session's resources
func (pb *PlaybackSession) Close() {
	pb.Socket.Close()
}

// LoadMessages : Reads the next batch of messages from the datastore, by timestamp range
func (loader *TimeIntervalLoader) LoadMessages() {
	log.Debugf(
		"Loading messages for {%d, %d}\n",
		loader.currentTimestamp,
		loader.currentTimestamp+loader.Interval,
	)
	messages, err := loader.Datastore.GetMessagesByTimestampRange(
		loader.Instrument,
		loader.currentTimestamp,
		loader.currentTimestamp+loader.Interval,
	)
	if err != nil {
		log.Errorf("Failed to retrieve messages: %s\n", err)
		close(loader.messages)
		return
	}
	loader.currentTimestamp += loader.Interval
	loader.messages <- messages
}

// Init : Initializes the loader's state based on the first snapshot
func (loader *TimeIntervalLoader) Init(orderbook *models.Orderbook, messages chan []*models.Message) {
	loader.currentTimestamp = orderbook.Timestamp
	loader.messages = messages
}

// LoadMessages : Reads the next batch of messages from the datastore, by number of messages
func (loader *CountIntervalLoader) LoadMessages() {
	log.Debugf(
		"Loading messages for {%d, %d}\n",
		loader.currentPage.SodOffset,
		loader.currentPage.SodOffset+loader.currentPage.NMessages,
	)
	messages, err := loader.Datastore.GetMessagesWithPagination(
		loader.Instrument,
		&loader.currentPage,
	)
	if err != nil {
		log.Errorf("Failed to retrieve messages: %s\n", err)
		close(loader.messages)
		return
	}
	loader.currentPage.SodOffset += loader.currentPage.NMessages
	loader.messages <- messages
}

// Init : Initializes the loader's state based on the first snapshot
func (loader *CountIntervalLoader) Init(orderbook *models.Orderbook, messages chan []*models.Message) {
	loader.currentPage = models.Paginator{NMessages: int64(loader.Count), SodOffset: int64(orderbook.LastSodOffset)}
	loader.messages = messages
}
