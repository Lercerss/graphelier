package hndlrs_test

import (
	"graphelier/core/graphelier-service/models"
	"testing"

	"github.com/stretchr/testify/assert"

	"graphelier/core/graphelier-service/api/hndlrs"
	. "graphelier/core/graphelier-service/utils/test_utils"
)

func TestFetchOrderInfoSuccess(t *testing.T) {

	mockedDB := MockDb(t)
	defer Ctrl.Finish()
	messages := []*models.Message{MakeMsg(TypeNewOrder, DirectionAsk)}
	// Making sure the db gets called with the correct start-of-day and end-of-day timestamps
	// using the timestamp provided
	mockedDB.EXPECT().
		GetSingleOrderMessages("test", int64(1579564800000000000), int64(1579651200000000000), int64(1)).
		Return(messages, nil)

	var orderInfo models.OrderInfo
	err := MakeRequest(
		hndlrs.FetchOrderInfo, // Function under test
		mockedDB,
		"GET",
		"/order/test/1/1579580821000000000",
		map[string]string{
			"instrument": "test",
			"orderID":    "1",
			"timestamp":  "1579580821000000000",
		},
		&orderInfo,
	)
	assert.Nil(t, err)

	// Checking that the orderhandler does not modify the built OrderInfo
	assert.EqualValues(t, 100, orderInfo.Price)
	assert.EqualValues(t, 10, orderInfo.Quantity)
	assert.EqualValues(t, 1, orderInfo.ID)
	assert.EqualValues(t, 1, orderInfo.CreatedOn)
	assert.EqualValues(t, 1, orderInfo.LastModifiedTimestamp)
	assert.EqualValues(t, "test", orderInfo.Instrument)
}

func TestFetchOrderInfoNoMoessages(t *testing.T) {

	mockedDB := MockDb(t)
	defer Ctrl.Finish()
	messages := []*models.Message{}
	mockedDB.EXPECT().
		GetSingleOrderMessages("test", int64(1579564800000000000), int64(1579651200000000000), int64(1)).
		Return(messages, nil)

	var orderInfo models.OrderInfo
	err := MakeRequest(
		hndlrs.FetchOrderInfo, // Function under test
		mockedDB,
		"GET",
		"/order/test/1/1579580821000000000",
		map[string]string{
			"instrument": "test",
			"orderID":    "1",
			"timestamp":  "1579580821000000000",
		},
		&orderInfo,
	)
	statusError := err.(hndlrs.StatusError)
	assert.NotNil(t, err)
	assert.EqualValues(t, 404, statusError.Status())
}
