package hndlrs

import (
	"encoding/json"
	"graphelier/core/graphelier-service/models"
	"io/ioutil"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/gorilla/mux"

	"github.com/stretchr/testify/mock"
)

type mockDBMsgHndlr struct {
	mock.Mock
}

func (db *mockDBMsgHndlr) GetInstruments() (result []string, err error) {
	return
}

func (db *mockDBMsgHndlr) GetSingleMessage(instrument string, sodOffset int64) (result *models.Message, err error) {
	return &models.Message{}, nil
}
func (db *mockDBMsgHndlr) GetOrderbook(instrument string, timestamp uint64) (*models.Orderbook, error) {
	return &models.Orderbook{}, nil
}
func (db *mockDBMsgHndlr) GetMessagesByTimestamp(instrument string, timestamp uint64) ([]*models.Message, error) {
	messages := make([]*models.Message, 0)
	return messages, nil
}
func (db *mockDBMsgHndlr) GetMessagesWithPagination(instrument string, paginator *models.Paginator) ([]*models.Message, error) {
	db.Called(instrument, paginator)
	messages := make([]*models.Message, 0)
	messages = append(messages, &models.Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 12, Price: 100, ShareQuantity: 10, Timestamp: 100, SodOffset: 1})
	messages = append(messages, &models.Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 13, Price: 100, ShareQuantity: 10, Timestamp: 100, SodOffset: 2})
	return messages, nil
}
func (db *mockDBMsgHndlr) RefreshCache() (err error) {
	return
}

func TestFetchMessagesSuccess(t *testing.T) {
	mockedDB := &mockDBMsgHndlr{}
	mockedEnv := &Env{mockedDB}
	req := httptest.NewRequest("GET", "/messages/test/100?nMessages=25", nil)
	vars := map[string]string{
		"instrument": "test",
		"sodOffset":  "100",
	}
	req = mux.SetURLVars(req, vars)
	writer := httptest.NewRecorder()
	mockedDB.On("GetMessagesWithPagination", "test", &models.Paginator{SodOffset: 100, NMessages: 25})

	err := FetchMessages(mockedEnv, writer, req)
	assert.Nil(t, err)
	resp := writer.Result()
	body, _ := ioutil.ReadAll(resp.Body)
	var messagePage models.MessagePage
	err = json.Unmarshal(body, &messagePage)

	mockedDB.AssertCalled(t, "GetMessagesWithPagination", "test", &models.Paginator{SodOffset: 100, NMessages: 25})
	assert.Nil(t, err)
	assert.Equal(t, int64(25), messagePage.PageInfo.NMessages)
	assert.Equal(t, int64(125), messagePage.PageInfo.SodOffset)
	assert.Equal(t, uint64(12), messagePage.Messages[0].OrderID)
}

func TestFetchMessagesDefaultValues(t *testing.T) {
	mockedDB := &mockDBMsgHndlr{}
	mockedEnv := &Env{mockedDB}
	req := httptest.NewRequest("GET", "/messages/test/100", nil)
	vars := map[string]string{
		"instrument": "test",
		"sodOffset":  "100",
	}
	req = mux.SetURLVars(req, vars)
	writer := httptest.NewRecorder()

	mockedDB.On("GetMessagesWithPagination", "test", &models.Paginator{SodOffset: 100, NMessages: 20})

	err := FetchMessages(mockedEnv, writer, req)
	assert.Nil(t, err)
	resp := writer.Result()
	body, _ := ioutil.ReadAll(resp.Body)
	var messagePage models.MessagePage
	err = json.Unmarshal(body, &messagePage)

	mockedDB.AssertCalled(t, "GetMessagesWithPagination", "test", &models.Paginator{SodOffset: 100, NMessages: 20})

	assert.Nil(t, err)
	assert.Equal(t, int64(20), messagePage.PageInfo.NMessages)
	assert.Equal(t, int64(120), messagePage.PageInfo.SodOffset)
	assert.Equal(t, uint64(12), messagePage.Messages[0].OrderID)
}

func TestFetchMessagesNegativeNMessages(t *testing.T) {
	mockedDB := &mockDBMsgHndlr{}
	mockedEnv := &Env{mockedDB}
	req := httptest.NewRequest("GET", "/messages/test/100?nMessages=-25", nil)
	vars := map[string]string{
		"instrument": "test",
		"sodOffset":  "100",
	}
	req = mux.SetURLVars(req, vars)
	writer := httptest.NewRecorder()

	mockedDB.On("GetMessagesWithPagination", "test", &models.Paginator{SodOffset: 100, NMessages: -25})

	err := FetchMessages(mockedEnv, writer, req)
	assert.Nil(t, err)
	resp := writer.Result()
	body, _ := ioutil.ReadAll(resp.Body)
	var messagePage models.MessagePage
	err = json.Unmarshal(body, &messagePage)

	mockedDB.AssertCalled(t, "GetMessagesWithPagination", "test", &models.Paginator{SodOffset: 100, NMessages: -25})

	assert.Nil(t, err)
	assert.Equal(t, int64(-25), messagePage.PageInfo.NMessages)
	assert.Equal(t, int64(75), messagePage.PageInfo.SodOffset)
	assert.Equal(t, 2, len(messagePage.Messages))
	// Checking to see if slice is reversed
	assert.Equal(t, uint64(13), messagePage.Messages[0].OrderID)
	assert.Equal(t, uint64(12), messagePage.Messages[1].OrderID)
}

func TestFetchMessagesBadInput(t *testing.T) {
	mockedDB := &mockDBMsgHndlr{}
	mockedEnv := &Env{mockedDB}
	req := httptest.NewRequest("GET", "/messages/test/10aa0", nil)
	vars := map[string]string{
		"instrument": "test",
		"sodOffset":  "10aa0",
	}
	req = mux.SetURLVars(req, vars)
	writer := httptest.NewRecorder()

	mockedDB.On("GetMessagesWithPagination", "test", mock.Anything, mock.Anything)

	err := FetchMessages(mockedEnv, writer, req)

	mockedDB.AssertNotCalled(t, "GetMessagesWithPagination", mock.Anything, mock.Anything)
	assert.NotNil(t, err)
}
