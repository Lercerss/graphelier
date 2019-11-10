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

func (db *mockDBObHndlr) GetSingleMessage(instrument string, sodOffset int64) (result *models.Message, err error) {
	db.Called(instrument, sodOffset)
	return &models.Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 15, Price: 100, ShareQuantity: 10, Timestamp: 100, SodOffset: 1}, nil
}
func (db *mockDBObHndlr) GetOrderbook(instrument string, timestamp uint64) (result *models.Orderbook, err error) {
	db.Called(instrument, timestamp)
	return &models.Orderbook{}, nil
}
func (db *mockDBObHndlr) GetMessagesByTimestamp(instrument string, timestamp uint64) (results []*models.Message, err error) {
	messages := make([]*models.Message, 0)
	return messages, nil
}
func (db *mockDBObHndlr) GetMessagesWithPagination(instrument string, paginator *models.Paginator) ([]*models.Message, error) {
	db.Called(instrument, paginator)
	messages := make([]*models.Message, 0)
	messages = append(messages, &models.Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 12, Price: 100, ShareQuantity: 10, Timestamp: 100, SodOffset: 1})
	messages = append(messages, &models.Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 13, Price: 100, ShareQuantity: 10, Timestamp: 100, SodOffset: 2})
	messages = append(messages, &models.Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 15, Price: 100, ShareQuantity: 10, Timestamp: 100, SodOffset: 3})
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
	mockedDB.On("GetSingleMessage", "test", int64(1))
	mockedDB.On("GetOrderbook", "test", uint64(100))
	mockedDB.On("GetMessagesWithPagination", "test", &models.Paginator{NMessages: 3, SodOffset: 0})

	err := FetchOrderbookDelta(mockedEnv, writer, req)
	assert.Nil(t, err)
	resp := writer.Result()
	body, _ := ioutil.ReadAll(resp.Body)
	var deltabook models.Orderbook
	err = json.Unmarshal(body, &deltabook)

	mockedDB.AssertCalled(t, "GetSingleMessage", "test", int64(1))
	mockedDB.AssertCalled(t, "GetOrderbook", "test", uint64(100))
	mockedDB.AssertCalled(t, "GetMessagesWithPagination", "test", &models.Paginator{NMessages: 3, SodOffset: 0})
	assert.Nil(t, err)
	assert.Equal(t, float64(100), deltabook.Asks[0].Price)
	assert.Equal(t, int(2), len(deltabook.Asks[0].Orders))
	assert.Equal(t, uint64(12), deltabook.Asks[0].Orders[0].ID)
	assert.Equal(t, int64(10), deltabook.Asks[0].Orders[0].Quantity)
	assert.Equal(t, uint64(15), deltabook.Asks[0].Orders[1].ID)
	assert.Equal(t, int64(10), deltabook.Asks[0].Orders[1].Quantity)
	assert.Equal(t, float64(100), deltabook.Bids[0].Price)
	assert.Equal(t, int(1), len(deltabook.Bids))
	assert.Equal(t, uint64(13), deltabook.Bids[0].Orders[0].ID)
	assert.Equal(t, int64(10), deltabook.Bids[0].Orders[0].Quantity)
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
	mockedDB.On("GetOrderbook", "test", mock.Anything)
	mockedDB.On("GetMessagesWithPagination", "test", mock.Anything)

	err := FetchOrderbookDelta(mockedEnv, writer, req)
	mockedDB.AssertNotCalled(t, "GetSingleMessage", "test", mock.Anything)
	mockedDB.AssertNotCalled(t, "GetOrderbook", "test", mock.Anything)
	mockedDB.AssertNotCalled(t, "GetMessagesWithPagination", "test", mock.Anything)
	assert.NotNil(t, err)
}

func TestFetchOrderbookDeltaNegativeOffset(t *testing.T) {
	mockedDB := &mockDBObHndlr{}
	mockedEnv := &Env{mockedDB}
	req := httptest.NewRequest("GET", "/delta/test/2/-1", nil)
	vars := map[string]string{
		"instrument":   "test",
		"sod_offset":   "2",
		"num_messages": "-1",
	}
	req = mux.SetURLVars(req, vars)
	writer := httptest.NewRecorder()
	mockedDB.On("GetSingleMessage", "test", int64(2))
	mockedDB.On("GetOrderbook", "test", uint64(100))
	mockedDB.On("GetMessagesWithPagination", "test", &models.Paginator{NMessages: 2, SodOffset: 0})

	err := FetchOrderbookDelta(mockedEnv, writer, req)
	assert.Nil(t, err)
	resp := writer.Result()
	body, _ := ioutil.ReadAll(resp.Body)
	var deltabook models.Orderbook
	err = json.Unmarshal(body, &deltabook)

	mockedDB.AssertCalled(t, "GetSingleMessage", "test", int64(2))
	mockedDB.AssertCalled(t, "GetOrderbook", "test", uint64(100))
	mockedDB.AssertCalled(t, "GetMessagesWithPagination", "test", &models.Paginator{NMessages: 2, SodOffset: 0})
	assert.Nil(t, err)
	assert.Equal(t, float64(100), deltabook.Asks[0].Price)
	assert.Equal(t, int(1), len(deltabook.Asks[0].Orders))
	assert.Equal(t, uint64(12), deltabook.Asks[0].Orders[0].ID)
	assert.Equal(t, int64(10), deltabook.Asks[0].Orders[0].Quantity)
	assert.Equal(t, int(0), len(deltabook.Bids))
}

func TestFetchOrderbookDeltaBadRequest(t *testing.T) {
	mockedDB := &mockDBObHndlr{}
	mockedEnv := &Env{mockedDB}
	req := httptest.NewRequest("GET", "/delta/test/1/-2", nil)
	vars := map[string]string{
		"instrument":   "test",
		"sod_offset":   "1",
		"num_messages": "-2",
	}
	req = mux.SetURLVars(req, vars)
	writer := httptest.NewRecorder()
	mockedDB.On("GetSingleMessage", "test", mock.Anything)
	mockedDB.On("GetOrderbook", "test", mock.Anything)
	// TODO : add ordered call for another GetOrderbook when mocking library is implemented
	mockedDB.On("GetMessagesWithPagination", "test", mock.Anything)

	err := FetchOrderbookDelta(mockedEnv, writer, req)
	assert.NotNil(t, err)
	resp := writer.Result()
	body, _ := ioutil.ReadAll(resp.Body)
	var deltabook models.Orderbook
	err = json.Unmarshal(body, &deltabook)

	mockedDB.AssertCalled(t, "GetSingleMessage", "test", mock.Anything)
	mockedDB.AssertCalled(t, "GetOrderbook", "test", mock.Anything)
	mockedDB.AssertNotCalled(t, "GetMessagesWithPagination", "test", mock.Anything)
	assert.NotNil(t, err)
}

// TODO : write test to retrieve previous orderbook with negative total offset once mock library is implemented
// TODO : perhaps add ordered call for another GetOrderbook when mocking library is implemented
