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
	messages         chan []*models.Message
	currentTimestamp uint64
	interval         uint64
	realtime         time.Time
	running          bool
}

var upgrader = websocket.Upgrader{}

// StreamPlayback: Initiates a websocket connection and starts streaming order book modifications for playback
func StreamPlayback(env *Env, w http.ResponseWriter, r *http.Request) error {
	params := mux.Vars(r)
	instrument := params["instrument"]
	startTimestamp, err := strconv.ParseUint(params["start_timestamp"], 10, 64)
	if err != nil {
		return StatusError{400, err}
	}
	speed, err := strconv.ParseFloat(params["speed"], 64)
	if err != nil {
		return StatusError{400, err}
	}

	session := PlaybackSession{Datastore: env.Datastore, Speed: speed}
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

	err = session.Start()
	if err != nil {
		return StatusError{500, err}
	}

	return nil
}

func (pb *PlaybackSession) Start() error {
	pb.realtime = time.Now()
	pb.interval = uint64(2e9 / pb.Speed)
	pb.running = true
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

		pb.Socket.WriteJSON(modifications)

		pb.realtime = pb.realtime.Add(time.Duration(pb.interval))
		log.Debugf("Sleeping for %v\n", time.Until(pb.realtime))
		<-time.After(time.Until(pb.realtime))
	}
	return nil
}

func (pb *PlaybackSession) loadMessages() {
	pb.currentTimestamp += pb.interval
	log.Debugf("low: %d, high: %d\n", pb.currentTimestamp, pb.currentTimestamp+pb.interval)
	messages, err := pb.Datastore.GetMessagesByTimestampRange(pb.Orderbook.Instrument, pb.currentTimestamp, pb.currentTimestamp+pb.interval)
	if err != nil {
		log.Errorf("Failed to retrieve messages: %s\n", err)
		close(pb.messages)
		return
	}
	pb.messages <- messages
}

func (pb *PlaybackSession) InitSocket(w http.ResponseWriter, r *http.Request) error {
	socket, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Errorf("Failed to open socket connection: %s\n", err)
		return err
	}
	pb.Socket = socket
	return nil
}

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

func (pb *PlaybackSession) Close() {
	// TODO Cleaner teardown?
	pb.Socket.Close()
}
