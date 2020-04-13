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
	Timestamp(*models.Orderbook) uint64
}

// TimeIntervalLoader : Loads messages by time intervals
type TimeIntervalLoader struct {
	Instrument       string
	Datastore        db.Datastore
	Interval         uint64
	messages         chan []*models.Message
	CurrentTimestamp uint64
}

// CountIntervalLoader : Loads messages by regular count intervals
type CountIntervalLoader struct {
	Instrument  string
	Datastore   db.Datastore
	Count       uint64
	messages    chan []*models.Message
	currentPage models.Paginator
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

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
	sodOffset, err := strconv.ParseUint(params["sodOffset"], 10, 64)
	if err != nil {
		return StatusError{400, err}
	}
	message, err := env.Datastore.GetSingleMessage(instrument, int64(sodOffset))
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
		loader = &TimeIntervalLoader{
			Instrument:       instrument,
			Datastore:        env.Datastore,
			Interval:         uint64(delay * rateRealtime),
			CurrentTimestamp: message.Timestamp,
		}
	default:
		return StatusError{400, ParamError{"One of rateMessages or rateRealtime must be provided"}}
	}

	session := PlaybackSession{Delay: uint64(delay), Loader: loader}
	err = session.LoadOrderBook(env.Datastore, instrument, message.Timestamp, sodOffset)
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
		log.Tracef("Got %d messages\n", len(messages))
		modifications := pb.Orderbook.YieldModifications(messages)
		modifications.Timestamp = pb.Loader.Timestamp(pb.Orderbook)
		log.Tracef("Generated %d modifications\n", len(modifications.Modifications))

		go pb.Loader.LoadMessages()

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
func (pb *PlaybackSession) LoadOrderBook(db db.Datastore, instrument string, startTimestamp uint64, sodOffset uint64) error {
	orderbook, err := db.GetOrderbook(instrument, startTimestamp)
	if err != nil {
		return err
	}
	paginator := &models.Paginator{
		SodOffset: int64(orderbook.LastSodOffset),
		NMessages: int64(sodOffset - orderbook.LastSodOffset),
	}
	messages := []*models.Message{}
	if paginator.NMessages > 0 {
		messages, err = db.GetMessagesWithPagination(instrument, paginator)
		if err != nil {
			return err
		}
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
		loader.CurrentTimestamp,
		loader.CurrentTimestamp+loader.Interval,
	)
	messages, err := loader.Datastore.GetMessagesByTimestampRange(
		loader.Instrument,
		loader.CurrentTimestamp,
		loader.CurrentTimestamp+loader.Interval,
	)
	if err != nil {
		log.Errorf("Failed to retrieve messages: %s\n", err)
		close(loader.messages)
		return
	}
	loader.CurrentTimestamp += loader.Interval
	loader.messages <- messages
}

// Init : Initializes the loader's state based on the first snapshot
func (loader *TimeIntervalLoader) Init(orderbook *models.Orderbook, messages chan []*models.Message) {
	if orderbook.Timestamp > loader.CurrentTimestamp {
		loader.CurrentTimestamp = orderbook.Timestamp
	}
	loader.messages = messages
}

// Timestamp : Max between orderbook and loader timestamp, as there might not be any messages for the current time increment
func (loader *TimeIntervalLoader) Timestamp(orderbook *models.Orderbook) uint64 {
	if loader.CurrentTimestamp > orderbook.Timestamp {
		return loader.CurrentTimestamp
	}
	return orderbook.Timestamp
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

// Timestamp : No specific timestamp logic for CountIntervalLoader
func (loader *CountIntervalLoader) Timestamp(orderbook *models.Orderbook) uint64 {
	return orderbook.Timestamp
}
