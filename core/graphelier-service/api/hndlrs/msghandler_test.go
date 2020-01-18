package hndlrs_test

import (
	"graphelier/core/graphelier-service/api/hndlrs"
	"graphelier/core/graphelier-service/models"
	. "graphelier/core/graphelier-service/utils/test_utils"
	"testing"

	"github.com/stretchr/testify/assert"
)

var messages []*models.Message = []*models.Message{
	MakeMsg(DirectionAsk, OrderID(12), SodOffset(1)),
	MakeMsg(DirectionAsk, OrderID(13), SodOffset(2)),
}

func TestFetchMessagesSuccess(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	mockedDB.EXPECT().
		GetMessagesWithPagination("test", &models.Paginator{SodOffset: 100, NMessages: 25}).
		Return(messages, nil)

	var messagePage models.MessagePage
	err := MakeRequest(
		hndlrs.FetchMessages, // Function under test
		mockedDB,
		"GET",
		"/messages/test/100?nMessages=25",
		map[string]string{
			"instrument": "test",
			"sodOffset":  "100",
		},
		&messagePage,
	)
	assert.Nil(t, err)

	assert.Equal(t, int64(25), messagePage.PageInfo.NMessages)
	assert.Equal(t, int64(125), messagePage.PageInfo.SodOffset)
	assert.Equal(t, uint64(12), messagePage.Messages[0].OrderID)
}

func TestFetchMessagesDefaultValues(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	mockedDB.EXPECT().
		GetMessagesWithPagination("test", &models.Paginator{SodOffset: 100, NMessages: 20}).
		Return(messages, nil)

	var messagePage models.MessagePage
	err := MakeRequest(
		hndlrs.FetchMessages, // Function under test
		mockedDB,
		"GET",
		"/messages/test/100", // No value for `nMessages`
		map[string]string{
			"instrument": "test",
			"sodOffset":  "100",
		},
		&messagePage,
	)

	assert.Nil(t, err)
	assert.Equal(t, int64(20), messagePage.PageInfo.NMessages)
	assert.Equal(t, int64(120), messagePage.PageInfo.SodOffset)
	assert.Equal(t, uint64(12), messagePage.Messages[0].OrderID)
}

func TestFetchMessagesNegativeNMessages(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	mockedDB.EXPECT().
		GetMessagesWithPagination("test", &models.Paginator{SodOffset: 100, NMessages: -25}).
		Return(messages, nil)

	var messagePage models.MessagePage
	err := MakeRequest(
		hndlrs.FetchMessages, // Function under test
		mockedDB,
		"GET",
		"/messages/test/100?nMessages=-25",
		map[string]string{
			"instrument": "test",
			"sodOffset":  "100",
		},
		&messagePage,
	)
	assert.Nil(t, err)

	assert.Nil(t, err)
	assert.Equal(t, int64(-25), messagePage.PageInfo.NMessages)
	assert.Equal(t, int64(75), messagePage.PageInfo.SodOffset)
	assert.Equal(t, 2, len(messagePage.Messages))
	// Checking to see if slice is reversed
	assert.Equal(t, uint64(13), messagePage.Messages[0].OrderID)
	assert.Equal(t, uint64(12), messagePage.Messages[1].OrderID)
}

func TestFetchMessagesBadInput(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	mockedDB.EXPECT().
		GetMessagesWithPagination("test", &models.Paginator{SodOffset: 100, NMessages: 20}).
		MaxTimes(0)

	var messagePage models.MessagePage
	err := MakeRequest(
		hndlrs.FetchMessages, // Function under test
		mockedDB,
		"GET",
		"/messages/test/10aa0",
		map[string]string{
			"instrument": "test",
			"sodOffset":  "10aa0",
		},
		&messagePage,
	)
	assert.NotNil(t, err)
}
