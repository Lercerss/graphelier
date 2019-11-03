package hndlrs

import (
	"encoding/json"
	"io/ioutil"
	"net/http/httptest"
	"testing"

	"graphelier/core/graphelier-service/models"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockDBObHndlr struct {
	mock.Mock
}

func (db *mockDBObHndlr) GetSingleMessage(instrument string, totalOffset int64) (result *models.Message, err error) {
	db.Called(instrument, totalOffset)
	return &models.Message{Direction: -1, Instrument: "test", MessageType: 1, OrderID: 15, Price: 100, ShareQuantity: 10, Timestamp: 100, SodOffset: 3}, nil
}
func (db *mockDBObHndlr) GetOrderbook(instrument string, timestamp uint64) (result *models.Orderbook, err error) {
	db.Called(instrument, timestamp)
	return &models.Orderbook{}, nil
}
func (db *mockDBObHndlr) GetMessages(instrument string, timestamp uint64) (results []*models.Message, err error) {
	db.Called(instrument, timestamp)
	messages := make([]*models.Message, 0)
	messages = append(messages, &models.Message{Direction: -1, Instrument: "test", MessageType: 1, OrderID: 12, Price: 100, ShareQuantity: 10, Timestamp: 100, SodOffset: 1})
	messages = append(messages, &models.Message{Direction: 1, Instrument: "test", MessageType: 1, OrderID: 13, Price: 100, ShareQuantity: 10, Timestamp: 100, SodOffset: 2})
	return messages, nil
}
func (db *mockDBObHndlr) GetMessagesWithPagination(instrument string, timestamp int64, paginator *models.Paginator) ([]*models.Message, error) {
	messages := make([]*models.Message, 0)
	return messages, nil
}

func TestFetchOrderbookDeltaSuccess(t *testing.T) {
	mockedDB := &mockDBObHndlr{}
	mockedEnv := &Env{mockedDB}
	req := httptest.NewRequest("GET", "/delta/test/1/2", nil)
	vars := map[string]string{
		"instrument":   "test",
		"sod_offset":   "1",
		"num_messages": "2",
	}
	req = mux.SetURLVars(req, vars)
	writer := httptest.NewRecorder()
	mockedDB.On("GetSingleMessage", "test", int64(3))
	mockedDB.On("GetMessages", "test", uint64(100))
	mockedDB.On("GetOrderbook", "test", uint64(100))

	err := FetchOrderbookDelta(mockedEnv, writer, req)
	assert.Nil(t, err)
	resp := writer.Result()
	body, _ := ioutil.ReadAll(resp.Body)
	var deltabook models.Orderbook
	err = json.Unmarshal(body, &deltabook)

	mockedDB.AssertCalled(t, "GetSingleMessage", "test", int64(3))
	mockedDB.AssertCalled(t, "GetMessages", "test", uint64(100))
	mockedDB.AssertCalled(t, "GetOrderbook", "test", uint64(100))
	assert.Nil(t, err)
	assert.Equal(t, float64(100), deltabook.Asks[0].Price)
	assert.Equal(t, int(1), len(deltabook.Asks[0].Orders))
	assert.Equal(t, uint64(12), deltabook.Asks[0].Orders[0].ID)
	assert.Equal(t, uint64(10), deltabook.Asks[0].Orders[0].Quantity)
	assert.Equal(t, int(0), len(deltabook.Bids))
}

func TestFetchOrderbookDeltaBadInput(t *testing.T) {
	mockedDB := &mockDBObHndlr{}
	mockedEnv := &Env{mockedDB}
	req := httptest.NewRequest("GET", "/delta/test/1/2abc", nil)
	vars := map[string]string{
		"instrument":   "test",
		"sod_offset":   "1",
		"num_messages": "2abc",
	}
	req = mux.SetURLVars(req, vars)
	writer := httptest.NewRecorder()
	mockedDB.On("GetSingleMessage", "test", mock.Anything)
	mockedDB.On("GetMessages", "test", mock.Anything)
	mockedDB.On("GetOrderbook", "test", mock.Anything)

	err := FetchOrderbookDelta(mockedEnv, writer, req)
	mockedDB.AssertNotCalled(t, "GetSingleMessage", "test", mock.Anything)
	mockedDB.AssertNotCalled(t, "GetMessages", "test", mock.Anything)
	mockedDB.AssertNotCalled(t, "GetOrderbook", "test", mock.Anything)
	assert.NotNil(t, err)
}

func TestFetchOrderbookDeltaBigNegativeOffset(t *testing.T) {
	mockedDB := &mockDBObHndlr{}
	mockedEnv := &Env{mockedDB}
	req := httptest.NewRequest("GET", "/delta/test/1/-5", nil)
	vars := map[string]string{
		"instrument":   "test",
		"sod_offset":   "1",
		"num_messages": "-5",
	}
	req = mux.SetURLVars(req, vars)
	writer := httptest.NewRecorder()
	mockedDB.On("GetSingleMessage", "test", int64(0))
	mockedDB.On("GetMessages", "test", uint64(100))
	mockedDB.On("GetOrderbook", "test", uint64(100))

	err := FetchOrderbookDelta(mockedEnv, writer, req)
	assert.Nil(t, err)
	resp := writer.Result()
	body, _ := ioutil.ReadAll(resp.Body)
	var deltabook models.Orderbook
	err = json.Unmarshal(body, &deltabook)

	mockedDB.AssertCalled(t, "GetSingleMessage", "test", int64(0))
	mockedDB.AssertCalled(t, "GetMessages", "test", uint64(100))
	mockedDB.AssertCalled(t, "GetOrderbook", "test", uint64(100))
	assert.Nil(t, err)
	assert.Equal(t, float64(100), deltabook.Asks[0].Price)
	assert.Equal(t, int(1), len(deltabook.Asks[0].Orders))
	assert.Equal(t, uint64(12), deltabook.Asks[0].Orders[0].ID)
	assert.Equal(t, uint64(10), deltabook.Asks[0].Orders[0].Quantity)
	assert.Equal(t, int(0), len(deltabook.Bids))
}
