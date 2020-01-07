package hndlrs

import (
	"encoding/json"
	"graphelier/core/graphelier-service/models"
	"io/ioutil"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockDBIHndlr struct {
	mock.Mock
}

func (db *mockDBIHndlr) GetInstruments() (result []string, err error) {
	result = []string{"TEST", "SPY", "AAPL"}
	return
}

func (db *mockDBIHndlr) GetSingleMessage(instrument string, sodOffset int64) (result *models.Message, err error) {
	return
}

func (db *mockDBIHndlr) GetOrderbook(instrument string, timestamp uint64) (result *models.Orderbook, err error) {
	return
}

func (db *mockDBIHndlr) GetMessagesByTimestamp(instrument string, timestamp uint64) (results []*models.Message, err error) {
	return
}

func (db *mockDBIHndlr) GetMessagesWithPagination(instrument string, paginator *models.Paginator) (result []*models.Message, err error) {
	return
}

func (db *mockDBIHndlr) RefreshCache() (err error) {
	return
}

func TestFetchInstruments(t *testing.T) {
	mockedDB := &mockDBIHndlr{}
	mockedEnv := &Env{mockedDB}

	req := httptest.NewRequest("GET", "/instruments/", nil)
	writer := httptest.NewRecorder()

	mockedDB.On("GetInstruments")

	err := FetchInstruments(mockedEnv, writer, req)
	assert.Nil(t, err)

	resp := writer.Result()
	body, _ := ioutil.ReadAll(resp.Body)
	var instruments []string
	err = json.Unmarshal(body, &instruments)
	assert.Nil(t, err)

	assert.Equal(t, 3, len(instruments))
}
