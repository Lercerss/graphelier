package hndlrs

import (
	"graphelier/core/graphelier-service/db"
	"graphelier/core/graphelier-service/models"
	"net/http"
	"strconv"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

type PlaybackSession struct {
	Datastore        db.Datastore
	Socket           *websocket.Conn
	Orderbook        *models.Orderbook
	Speed            float64
	Delay            uint64
	messages         chan []*models.Message
	currentTimestamp uint64
	interval         uint64
	realtime         time.Time
	running          bool
}

var upgrader = websocket.Upgrader{}

// StreamPlayback: Initiates a websocket connection and starts streaming order book modifications for playback
func StreamPlayback(env *Env, w http.ResponseWriter, r *http.Request) error {
	delay, err := strconv.ParseFloat(r.URL.Query().Get("delay"), 64)
	if err != nil {
		delay = 0.5
	}
	params := mux.Vars(r)
	instrument := params["instrument"]
	startTimestamp, err := strconv.ParseUint(params["start_timestamp"], 10, 64)
	if err != nil {
		return StatusError{400, err}
	}
	speed, err := strconv.ParseFloat(params["speed"], 64) // TODO variable rate
	if err != nil {
		return StatusError{400, err}
	}

	session := PlaybackSession{Datastore: env.Datastore, Speed: speed, Delay: uint64(delay * 1e9)}
	err = session.LoadOrderBook(instrument, startTimestamp)
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

// Start: streams modifications to the client until a close message is received
func (pb *PlaybackSession) Start() error {
	pb.realtime = time.Now()
	pb.interval = uint64(float64(pb.Delay) / pb.Speed)
	pb.running = true
	go pb.handleSocketControl()
	return pb.handleStreaming()
}

// generates modifications from messages and sends data to the client at regular intervals
func (pb *PlaybackSession) handleStreaming() error {
	go pb.loadMessages()
	for pb.running {
		messages, ok := <-pb.messages
		if !ok {
			log.Debugln("Stopping playback session")
			break
		}
		go pb.loadMessages()
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
		type_, _, err := pb.Socket.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseNoStatusReceived, websocket.CloseGoingAway) {
				log.Errorf("Unexpected error while waiting for input: %v\n", err)
			}
			pb.running = false
		}
		switch type_ {
		case websocket.CloseMessage:
			log.Infof("Terminating playback session with %s\n", pb.Socket.RemoteAddr())
			pb.running = false
		}
	}
}

// reads the next batch of messages from the datastore
func (pb *PlaybackSession) loadMessages() {
	// TODO handle different rates
	pb.currentTimestamp += pb.interval
	log.Debugf("Loading messages for {%d, %d}\n", pb.currentTimestamp, pb.currentTimestamp+pb.interval)
	messages, err := pb.Datastore.GetMessagesByTimestampRange(
		pb.Orderbook.Instrument,
		pb.currentTimestamp,
		pb.currentTimestamp+pb.interval,
	)
	if err != nil {
		log.Errorf("Failed to retrieve messages: %s\n", err)
		close(pb.messages)
		return
	}
	pb.messages <- messages
}

// InitSocket: Upgrades the http request to a websocket connection
func (pb *PlaybackSession) InitSocket(w http.ResponseWriter, r *http.Request) error {
	socket, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Errorf("Failed to open socket connection: %s\n", err)
		return err
	}
	pb.Socket = socket
	return nil
}

// LoadOrderBook: Establishes the initial state for the playback session
func (pb *PlaybackSession) LoadOrderBook(instrument string, startTimestamp uint64) error {
	orderbook, err := pb.Datastore.GetOrderbook(instrument, startTimestamp)
	if err != nil {
		return err
	}
	messages, err := pb.Datastore.GetMessagesByTimestamp(instrument, startTimestamp)
	if err != nil {
		return err
	}
	orderbook.ApplyMessagesToOrderbook(messages)
	log.Tracef("Loaded initial state for playback at %d\n", orderbook.Timestamp)
	pb.Orderbook = orderbook
	pb.messages = make(chan []*models.Message, 1)
	pb.currentTimestamp = orderbook.Timestamp
	return nil
}

// Close: Tears down the session's resources
func (pb *PlaybackSession) Close() {
	pb.Socket.Close()
}
