package hndlrs_test

import (
	"net"
	"testing"
	"time"

	"graphelier/core/graphelier-service/api/hndlrs"
	"graphelier/core/graphelier-service/models"
	. "graphelier/core/graphelier-service/utils/test_utils"

	"github.com/stretchr/testify/assert"
)

var pbMessages []*models.Message = []*models.Message{
	MakeMsg(Timestamp(101)),
}

func TestCounterIntervalLoader(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	loader := hndlrs.CountIntervalLoader{
		Instrument: "test",
		Datastore:  mockedDB,
		Count:      3,
	}

	orderbook := &models.Orderbook{LastSodOffset: 10, Timestamp: 5}
	output := make(chan []*models.Message, 1)
	loader.Init(orderbook, output)

	mockedDB.EXPECT().
		GetMessagesWithPagination("test", &models.Paginator{NMessages: 3, SodOffset: 10}).
		Return(pbMessages, nil)

	loader.LoadMessages() // Channels require concurrency
	assert.Equal(t, pbMessages, <-output)
}

func TestTimeIntervalLoader(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	loader := hndlrs.TimeIntervalLoader{
		Instrument: "test",
		Datastore:  mockedDB,
		Interval:   uint64(3),
	}

	orderbook := &models.Orderbook{LastSodOffset: 10, Timestamp: 5}
	output := make(chan []*models.Message, 1)
	loader.Init(orderbook, output)

	mockedDB.EXPECT().
		GetMessagesByTimestampRange("test", uint64(5), uint64(8)).
		Return(pbMessages, nil)

	loader.LoadMessages()
	assert.Equal(t, pbMessages, <-output)
}

func TestIntervalLoaderFailure(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	loader := hndlrs.TimeIntervalLoader{
		Instrument: "test",
		Datastore:  mockedDB,
		Interval:   uint64(3),
	}

	orderbook := &models.Orderbook{LastSodOffset: 10, Timestamp: 5}
	output := make(chan []*models.Message, 1)
	loader.Init(orderbook, output)

	mockedDB.EXPECT().
		GetMessagesByTimestampRange("test", uint64(5), uint64(8)).
		Return(nil, assert.AnError)

	loader.LoadMessages()
	_, ok := <-output // Channel should be closed
	assert.False(t, ok)
}

func TestNoRateParam(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	err := MakeRequest(
		hndlrs.StreamPlayback, // Function under test
		mockedDB,
		"GET",
		"/playback/test/1",
		map[string]string{
			"instrument": "test",
			"timestamp":  "1",
		},
		nil,
	)

	assert.Error(t, err)
	assert.IsType(t, hndlrs.ParamError{}, err.(hndlrs.StatusError).Err)
}

type MockSocket struct {
	Output []interface{}
}

func (socket *MockSocket) RemoteAddr() net.Addr {
	return nil
}

func (socket *MockSocket) WriteJSON(message interface{}) error {
	socket.Output = append(socket.Output, message)
	return nil
}

func (socket *MockSocket) ReadMessage() (int, []byte, error) {
	<-time.After(50 * time.Millisecond)
	return 8, nil, assert.AnError // Close connection
}

func (socket *MockSocket) Close() error {
	return nil
}

type MockLoader struct {
	messages chan []*models.Message
}

func (loader *MockLoader) Init(orderbook *models.Orderbook, messages chan []*models.Message) {
	loader.messages = messages
}

func (loader *MockLoader) LoadMessages() {
	loader.messages <- pbMessages
}

func TestPlaybackSession(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	socket := &MockSocket{}
	session := hndlrs.PlaybackSession{
		Delay:  100000000,
		Loader: &MockLoader{},
		Socket: socket,
	}
	mockedDB.EXPECT().
		GetOrderbook("test", uint64(100)).
		Return(&models.Orderbook{Timestamp: 100}, nil)
	mockedDB.EXPECT().
		GetMessagesByTimestamp("test", uint64(100)).
		Return([]*models.Message{}, nil)

	err := session.LoadOrderBook(mockedDB, "test", 100)
	assert.Nil(t, err)

	err = session.Start() // Function under test
	assert.Nil(t, err)

	assert.GreaterOrEqual(t, len(socket.Output), 1)
	result := socket.Output[0].(*models.Modifications)
	assert.Equal(t, uint64(101), result.Timestamp)
	modification := result.Modifications[0]
	assert.Equal(t, uint64(1), modification.Offset)
	assert.Equal(t, models.AddOrderType, modification.Type)
}
