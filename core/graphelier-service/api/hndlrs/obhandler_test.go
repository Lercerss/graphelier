package hndlrs_test

import (
	"testing"

	"github.com/golang/mock/gomock"

	"graphelier/core/graphelier-service/api/hndlrs"
	"graphelier/core/graphelier-service/models"
	. "graphelier/core/graphelier-service/utils/test_utils"

	"github.com/stretchr/testify/assert"
)

var ob_messages []*models.Message = []*models.Message{
	MakeMsg(DirectionAsk, OrderID(12), SodOffset(1)),
	MakeMsg(DirectionBid, OrderID(13), SodOffset(2)),
	MakeMsg(DirectionAsk, OrderID(15), SodOffset(3)),
}

func TestFetchOrderbookDeltaSuccess(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	mockedDB.EXPECT().
		GetSingleMessage("test", int64(1)).
		Return(ob_messages[0], nil)
	mockedDB.EXPECT().
		GetOrderbook("test", uint64(1)).
		Return(&models.Orderbook{}, nil)
	mockedDB.EXPECT().
		GetMessagesWithPagination("test", &models.Paginator{NMessages: 3, SodOffset: 0}).
		Return(ob_messages, nil)

	var deltabook models.Orderbook
	err := MakeRequest(
		hndlrs.FetchOrderbookDelta, // Function under test
		mockedDB,
		"GET",
		"/delta/test/1/2",
		map[string]string{
			"instrument":   "test",
			"sod_offset":   "1",
			"num_messages": "2",
		},
		&deltabook,
	)

	assert.Nil(t, err)

	// Check that orders have been added according to the NEW_ORDER messages
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

	assert.Equal(t, uint64(3), deltabook.LastSodOffset)
}

func TestFetchOrderbookDeltaBadInput(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	mockedDB.EXPECT().GetSingleMessage(gomock.Any(), gomock.Any()).MaxTimes(0)
	mockedDB.EXPECT().GetOrderbook(gomock.Any(), gomock.Any()).MaxTimes(0)
	mockedDB.EXPECT().GetMessagesWithPagination(gomock.Any(), gomock.Any()).MaxTimes(0)

	var deltabook models.Orderbook
	err := MakeRequest(
		hndlrs.FetchOrderbookDelta, // Function under test
		mockedDB,
		"GET",
		"/delta/test/1/2abc",
		map[string]string{
			"instrument":   "test",
			"sod_offset":   "1",
			"num_messages": "2abc",
		},
		&deltabook,
	)
	assert.NotNil(t, err)
}

func TestFetchOrderbookDeltaNegativeNMessages(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	mockedDB.EXPECT().
		GetSingleMessage("test", int64(3)).
		Return(
			MakeMsg(SodOffset(3), Timestamp(2)),
			nil,
		)
	mockedDB.EXPECT().
		GetOrderbook("test", uint64(2)).Times(1).
		Return(&models.Orderbook{Timestamp: 2, LastSodOffset: 3}, nil)
	mockedDB.EXPECT().
		GetOrderbook("test", uint64(1)).Times(1).
		Return(&models.Orderbook{Timestamp: 0, LastSodOffset: 0, Instrument: "test"}, nil)
	mockedDB.EXPECT().
		GetMessagesWithPagination("test", &models.Paginator{NMessages: 5, SodOffset: 0}).
		Return(ob_messages, nil)

	var deltabook models.Orderbook
	err := MakeRequest(
		hndlrs.FetchOrderbookDelta, // Function under test
		mockedDB,
		"GET",
		"/delta/test/3/-2",
		map[string]string{
			"instrument":   "test",
			"sod_offset":   "3",
			"num_messages": "-2",
		},
		&deltabook,
	)
	assert.Nil(t, err)
	var expected models.Orderbook = models.Orderbook{
		Timestamp:     uint64(1),
		Instrument:    "test",
		LastSodOffset: 1,
		Bids: []*models.Level{
			MakeLevel(100), // Empty level signifies it was deleted
		},
		Asks: []*models.Level{
			MakeLevel(100, &models.Order{ID: 12, Quantity: 10}),
		},
	}
	assert.Equal(t, expected, deltabook)
}

func TestFetchOrderbookDeltaExecuteHiddenOrder(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	test_messages := make([]*models.Message, len(ob_messages))
	copy(test_messages, ob_messages)
	test_messages = append(
		ob_messages,
		// Add an execute for hideen order
		MakeMsg(OrderID(0), SodOffset(4), TypeExecute),
	)

	mockedDB.EXPECT().
		GetSingleMessage("test", int64(1)).
		Return(ob_messages[0], nil)
	mockedDB.EXPECT().
		GetOrderbook("test", uint64(1)).
		Return(&models.Orderbook{}, nil)
	mockedDB.EXPECT().
		GetMessagesWithPagination("test", &models.Paginator{NMessages: 4, SodOffset: 0}).
		Return(test_messages, nil)

	var deltabook models.Orderbook
	err := MakeRequest(
		hndlrs.FetchOrderbookDelta, // Function under test
		mockedDB,
		"GET",
		"/delta/test/1/3",
		map[string]string{
			"instrument":   "test",
			"sod_offset":   "1",
			"num_messages": "3",
		},
		&deltabook,
	)

	assert.Nil(t, err)
	assert.Equal(t, uint64(4), deltabook.LastSodOffset)
}

func TestFetchOrderbookSuccess(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	mockedDB.EXPECT().
		GetOrderbook("test", uint64(1)).
		Return(&models.Orderbook{Instrument: "test"}, nil)
	mockedDB.EXPECT().
		GetMessagesByTimestamp("test", uint64(1)).
		Return(ob_messages, nil)

	var orderbook models.Orderbook
	err := MakeRequest(
		hndlrs.FetchOrderbook, // Function under test
		mockedDB,
		"GET",
		"/orderbook/test/1",
		map[string]string{
			"instrument": "test",
			"timestamp":  "1",
		},
		&orderbook,
	)

	assert.Nil(t, err)
	var expected models.Orderbook = models.Orderbook{
		Timestamp:     uint64(1),
		Instrument:    "test",
		LastSodOffset: 3,
		Bids: []*models.Level{
			MakeLevel(100, &models.Order{ID: 13, Quantity: 10}),
		},
		Asks: []*models.Level{
			MakeLevel(100, &models.Order{ID: 12, Quantity: 10}, &models.Order{ID: 15, Quantity: 10}),
		},
	}
	assert.Equal(t, expected, orderbook)
}

func TestFetchOrderbookNoMessages(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	mockedDB.EXPECT().
		GetOrderbook("test", uint64(1)).
		Return(&models.Orderbook{Instrument: "test"}, nil)
	mockedDB.EXPECT().
		GetMessagesByTimestamp("test", uint64(1)).
		Return(make([]*models.Message, 0), nil)

	var orderbook models.Orderbook
	err := MakeRequest(
		hndlrs.FetchOrderbook, // Function under test
		mockedDB,
		"GET",
		"/orderbook/test/1",
		map[string]string{
			"instrument": "test",
			"timestamp":  "1",
		},
		&orderbook,
	)

	assert.Nil(t, err)
	var expected models.Orderbook = models.Orderbook{
		Instrument: "test",
	}
	assert.Equal(t, expected, orderbook)
}
