package models_test

import (
	. "graphelier/core/graphelier-service/models"
	. "graphelier/core/graphelier-service/utils/test_utils"
	"testing"

	"github.com/stretchr/testify/assert"
)

var orderbook *Orderbook
var deltabook *Orderbook
var messages []*Message
var bids []*Level
var asks []*Level

// setupExistingOrders : Initializes messages, orderbook and deltabook. orderbook is pre-set with 3 bids and 3 asks
func setupExistingOrders() {
	bids = []*Level{MakeLevel(
		100.0,
		&Order{ID: 1, Quantity: 10},
		&Order{ID: 2, Quantity: 10},
		&Order{ID: 3, Quantity: 10},
	)}
	asks = []*Level{MakeLevel(
		100.0,
		&Order{ID: 1, Quantity: 10},
		&Order{ID: 2, Quantity: 10},
		&Order{ID: 3, Quantity: 10},
	)}
	messages = []*Message{
		MakeMsg(DirectionAsk, OrderID(12), Price(100.0), Timestamp(99), SodOffset(1)),
		MakeMsg(DirectionAsk, OrderID(17), Price(200.0), Timestamp(100), SodOffset(4)),
		MakeMsg(DirectionBid, OrderID(13), Price(100.0), Timestamp(99), SodOffset(2)),
		MakeMsg(DirectionBid, OrderID(20), Price(200.0), Timestamp(100), SodOffset(5)),
	}
	orderbook = &Orderbook{Asks: asks, Bids: bids}
	deltabook = &Orderbook{}
}

// setupEmpty : See setupExistingOrders, except orderbook does not have bids or asks
func setupEmpty() {
	setupExistingOrders()
	orderbook = &Orderbook{}
}

func TestNewOrderBidsSamePrice(t *testing.T) {
	setupEmpty()

	messages[3].Price = 100.0

	orderbook.ApplyMessagesToOrderbook(messages[2:4])
	actualPriceLevel := orderbook.Bids[0]
	assert.Equal(t, 100.0, actualPriceLevel.Price)
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking priority is kept
	assert.EqualValues(t, 13, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 20, actualPriceLevel.Orders[1].ID)
}

func TestNewOrderBidsAccrossPriceLevels(t *testing.T) {
	setupEmpty()

	orderbook.ApplyMessagesToOrderbook(messages[2:4])
	// Two different price levels
	assert.Equal(t, 2, len(orderbook.Bids))
	actualHighPriceLevel := orderbook.Bids[0]
	actualLowPriceLevel := orderbook.Bids[1]
	assert.Equal(t, 100.0, actualLowPriceLevel.Price)
	assert.Equal(t, 200.0, actualHighPriceLevel.Price)
	assert.Equal(t, 1, len(actualLowPriceLevel.Orders))
	assert.Equal(t, 1, len(actualHighPriceLevel.Orders))

	assert.EqualValues(t, 13, actualLowPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 20, actualHighPriceLevel.Orders[0].ID)
}
func TestNewOrderAsks(t *testing.T) {
	setupEmpty()

	messages[1].Price = 100.0

	orderbook.ApplyMessagesToOrderbook(messages[0:2])
	actualPriceLevel := orderbook.Asks[0]
	assert.Equal(t, 100.0, actualPriceLevel.Price)
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking priority is kept
	assert.EqualValues(t, 12, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 17, actualPriceLevel.Orders[1].ID)
}

func TestDeleteOrderBids(t *testing.T) {
	setupExistingOrders()
	deleteOrder := MakeMsg(OrderID(2), TypeDelete)

	orderbook.ApplyMessagesToOrderbook([]*Message{deleteOrder})
	actualPriceLevel := orderbook.Bids[0]
	assert.Equal(t, 100.0, actualPriceLevel.Price)
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking priority is kept
	assert.EqualValues(t, 1, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 3, actualPriceLevel.Orders[1].ID)

	deleteOrder1 := MakeMsg(OrderID(1), TypeDelete)
	deleteOrder3 := MakeMsg(OrderID(3), TypeDelete)

	// Dropping all remaining orders
	orderbook.ApplyMessagesToOrderbook([]*Message{deleteOrder1, deleteOrder3})
	// Price level should have been deleted
	assert.Equal(t, 0, len(orderbook.Bids))
}

func TestDeleteOrderAsks(t *testing.T) {
	setupExistingOrders()
	deleteOrder := MakeMsg(OrderID(2), TypeDelete, DirectionAsk)

	orderbook.ApplyMessagesToOrderbook([]*Message{deleteOrder})
	actualPriceLevel := orderbook.Asks[0]
	assert.Equal(t, 100.0, actualPriceLevel.Price)
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking priority is kept
	assert.EqualValues(t, 1, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 3, actualPriceLevel.Orders[1].ID)

	deleteOrder1 := MakeMsg(OrderID(1), TypeDelete, DirectionAsk)
	deleteOrder3 := MakeMsg(OrderID(3), TypeDelete, DirectionAsk)

	// Dropping all remaining orders
	orderbook.ApplyMessagesToOrderbook([]*Message{deleteOrder1, deleteOrder3})
	// Price level should have been deleted
	assert.Equal(t, 0, len(orderbook.Asks))
}

func TestModifyOrder(t *testing.T) {
	setupExistingOrders()
	modifyOrder1 := MakeMsg(OrderID(1), TypeModify, ShareQuantity(5))
	modifyOrder2 := MakeMsg(OrderID(2), TypeModify) // This modify simply removes the order

	orderbook.ApplyMessagesToOrderbook([]*Message{modifyOrder1, modifyOrder2})

	actualPriceLevel := orderbook.Bids[0]
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking to see priority hasn't changed
	assert.EqualValues(t, 1, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 3, actualPriceLevel.Orders[1].ID)

	// Checking to see that quantity was modified
	assert.EqualValues(t, 5, actualPriceLevel.Orders[0].Quantity)
}

func TestExecuteOrderBids(t *testing.T) {
	setupExistingOrders()
	executeOrder1 := MakeMsg(OrderID(1), TypeExecute) // This execute completely fills the order
	executeOrder2 := MakeMsg(OrderID(2), TypeExecute, ShareQuantity(5))

	orderbook.ApplyMessagesToOrderbook([]*Message{executeOrder1, executeOrder2})

	actualPriceLevel := orderbook.Bids[0]
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking priority is kept and orderID=1 is deleted
	assert.EqualValues(t, 2, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 3, actualPriceLevel.Orders[1].ID)

	// Checking to see that quantity was modified
	assert.EqualValues(t, 5, actualPriceLevel.Orders[0].Quantity)
}

func TestDeltaAskChange(t *testing.T) {
	setupEmpty()
	offsetMessage := MakeMsg(DirectionAsk, OrderID(15), ShareQuantity(50))
	messages = append(messages, offsetMessage)
	orderbook.ApplyMessagesToOrderbook(messages)
	// Add a new ask to the deltabook
	orderbook.BuildDeltabook(deltabook, offsetMessage, 1)

	// Should return the full price-level for asks at 100.0
	assert.Equal(t, int(1), len(deltabook.Asks))
	assert.Equal(t, int(2), len(deltabook.Asks[0].Orders))
	assert.Equal(t, int64(10), deltabook.Asks[0].Orders[0].Quantity)
	assert.Equal(t, int64(50), deltabook.Asks[0].Orders[1].Quantity)
	assert.Equal(t, int(0), len(deltabook.Bids))
}

func TestDeltaBidChange(t *testing.T) {
	setupEmpty()
	offsetMessage := MakeMsg(DirectionBid, OrderID(15), ShareQuantity(50))
	messages = append(messages, offsetMessage)
	orderbook.ApplyMessagesToOrderbook(messages)
	// Add a new bid to the deltabook
	orderbook.BuildDeltabook(deltabook, offsetMessage, 1)

	// Should return the full price-level for bids at 100.0
	assert.Equal(t, int(1), len(deltabook.Bids))
	assert.Equal(t, int(2), len(deltabook.Bids[0].Orders))
	assert.Equal(t, int64(10), deltabook.Bids[0].Orders[0].Quantity)
	assert.Equal(t, int64(50), deltabook.Bids[0].Orders[1].Quantity)
	assert.Equal(t, int(0), len(deltabook.Asks))
}

func TestEmptyLevel(t *testing.T) {
	setupEmpty()
	offsetMessage := MakeMsg(DirectionAsk, TypeDelete, OrderID(12))
	messages = append(messages, offsetMessage)
	orderbook.ApplyMessagesToOrderbook(messages)
	// Delete the only order from a price-level
	orderbook.BuildDeltabook(deltabook, offsetMessage, 1)

	// Should return an empty level to signify it was dropped
	assert.Equal(t, int(1), len(deltabook.Asks))
	assert.Equal(t, int(0), len(deltabook.Asks[0].Orders))
	assert.Equal(t, int(0), len(deltabook.Bids))
}

func TestApplyDeltaPositiveNumMessages(t *testing.T) {
	setupEmpty()
	// Apply multiple messages
	deltabook = orderbook.ApplyMessagesToDeltabook(messages, 2)

	// Should return all price-levels that have changed
	assert.Equal(t, int(2), len(deltabook.Asks))
	assert.Equal(t, int(1), len(deltabook.Asks[0].Orders))
	assert.Equal(t, int(1), len(deltabook.Asks[1].Orders))
	assert.Equal(t, int(0), len(deltabook.Bids))
}

func TestApplyDeltaNegativeNumMessages(t *testing.T) {
	setupEmpty()
	messages := []*Message{
		MakeMsg(DirectionAsk, OrderID(25)),
		MakeMsg(DirectionAsk, OrderID(26), Price(200)),
	}
	// Apply messages going backwards
	orderbook.ApplyMessagesToOrderbook(messages)
	messages = append(messages, MakeMsg(DirectionBid, OrderID(27)))
	deltabook = orderbook.ApplyMessagesToDeltabook(messages, -2)

	// Should return previous state of the price-levels that have changed
	assert.Equal(t, 1, len(deltabook.Asks[0].Orders))
	assert.Equal(t, 1, len(deltabook.Asks[1].Orders))
	assert.Equal(t, 0, len(deltabook.Bids))
}

func TestBuildDeltaBookBranches(t *testing.T) {
	// Suite to test different branches of BuildDeltabook
	testDeltaNoOrderIndexNoDeltaIndex := func(t *testing.T) {
		// Level doesn't exist in orderbook nor deltabook
		setupEmpty()

		orderbook.ApplyMessagesToOrderbook(messages[0:2])
		deltabook.ApplyMessagesToOrderbook(messages[2:4])
		message := MakeMsg(DirectionBid, OrderID(44), Price(99.0))
		orderbook.BuildDeltabook(deltabook, message, 3)

		assert.NotEqual(t, message.Price, orderbook.Asks[0].Price)
		assert.NotEqual(t, message.Price, orderbook.Asks[1].Price)
		assert.Equal(t, int(2), len(orderbook.Asks))
		assert.Equal(t, int(3), len(deltabook.Bids))
		assert.Equal(t, message.Price, deltabook.Bids[2].Price)
	}

	testDeltaNoOrderIndexDeltaIndex := func(t *testing.T) {
		// Level doesn't exist in orderbook but exists in deltabook
		setupEmpty()

		orderbook.ApplyMessagesToOrderbook(messages[0:2])
		deltabook.ApplyMessagesToOrderbook(messages[2:4])
		message := MakeMsg(DirectionBid, OrderID(44), Price(200.0))
		orderbook.BuildDeltabook(deltabook, message, 3)

		assert.NotEqual(t, message.Price, orderbook.Asks[0].Price)
		assert.Equal(t, int(2), len(orderbook.Asks))
		assert.Equal(t, int(2), len(deltabook.Bids))
		assert.Equal(t, message.Price, deltabook.Bids[0].Price)
		assert.Equal(t, int(0), len(deltabook.Bids[0].Orders))
	}

	testDeltaOrderIndexNoDeltaIndex := func(t *testing.T) {
		// Level doesn't exist in deltabook but exists in orderbook
		setupEmpty()

		orderbook.ApplyMessagesToOrderbook(messages[0:2])
		deltabook.ApplyMessagesToOrderbook(messages[2:4])
		message := MakeMsg(DirectionAsk, OrderID(44))
		orderbook.BuildDeltabook(deltabook, message, 3)

		assert.Equal(t, int(2), len(orderbook.Asks))
		assert.NotEqual(t, message.Price, deltabook.Bids[0].Price)
		assert.Equal(t, int(2), len(deltabook.Bids))
		assert.Equal(t, message.Price, deltabook.Asks[0].Price)
		assert.Equal(t, int(1), len(deltabook.Asks[0].Orders))
	}

	testDeltaOrderIndexDeltaIndex := func(t *testing.T) {
		// Level exists in both orderbook and deltabook
		setupEmpty()
		messages[2].Direction = Asks
		messages[3].Direction = Asks

		orderbook.ApplyMessagesToOrderbook(messages[0:2])
		deltabook.ApplyMessagesToOrderbook(messages[2:4])
		message := MakeMsg(DirectionAsk, OrderID(44))
		orderbook.BuildDeltabook(deltabook, message, 3)

		assert.Equal(t, len(orderbook.Asks), len(deltabook.Asks))
		assert.Equal(t, orderbook.Asks[0].Price, deltabook.Asks[0].Price)
		assert.Equal(t, orderbook.Asks[1].Price, deltabook.Asks[1].Price)
		assert.Equal(t, len(orderbook.Asks[0].Orders), len(deltabook.Asks[0].Orders))
		assert.Equal(t, len(orderbook.Asks[1].Orders), len(deltabook.Asks[1].Orders))
	}

	testDeltaNoOrderIndexNoDeltaIndex(t)
	testDeltaNoOrderIndexDeltaIndex(t)
	testDeltaOrderIndexNoDeltaIndex(t)
	testDeltaOrderIndexDeltaIndex(t)
}
func TestOrderbookPriceSort(t *testing.T) {
	setupEmpty()
	orderbook.ApplyMessagesToOrderbook(messages)

	// Asks are sorted ascending by price
	assert.Equal(t, float64(100), orderbook.Asks[0].Price)
	assert.Equal(t, float64(200), orderbook.Asks[1].Price)
	// Bids are sorted descending by price
	assert.Equal(t, float64(200), orderbook.Bids[0].Price)
	assert.Equal(t, float64(100), orderbook.Bids[1].Price)
}

func TestDeltaPriceSort(t *testing.T) {
	setupEmpty()
	deltabook := orderbook.ApplyMessagesToDeltabook(messages, 4)

	// Asks are sorted ascending by price
	assert.Equal(t, float64(100), deltabook.Asks[0].Price)
	assert.Equal(t, float64(200), deltabook.Asks[1].Price)
	// Bids are sorted descending by price
	assert.Equal(t, float64(200), deltabook.Bids[0].Price)
	assert.Equal(t, float64(100), deltabook.Bids[1].Price)
}

// TestTopBookPerXNano : Checks for topbook at every x nanosecond
func TestTopBookPerXNano(t *testing.T) {
	setupEmpty()
	messages = []*Message{
		MakeMsg(DirectionAsk, Price(106.0), Timestamp(100)),
		MakeMsg(DirectionAsk, Price(200.0), Timestamp(100)),
		MakeMsg(DirectionBid, Price(101.0), Timestamp(100)),
		MakeMsg(DirectionBid, Price(201.0), Timestamp(100)),
		MakeMsg(DirectionAsk, Price(108.0), Timestamp(101)),
		MakeMsg(DirectionAsk, Price(200.0), Timestamp(101)),
		MakeMsg(DirectionBid, Price(101.0), Timestamp(101)),
		MakeMsg(DirectionBid, Price(201.0), Timestamp(101)),
		MakeMsg(DirectionAsk, Price(102.0), Timestamp(102)),
		MakeMsg(DirectionAsk, Price(201.0), Timestamp(102)),
		MakeMsg(DirectionBid, Price(101.0), Timestamp(102)),
		MakeMsg(DirectionBid, Price(202.0), Timestamp(102)),
	}

	pointDistance := 2
	topbook := orderbook.TopBookPerXNano(messages, uint64(pointDistance), 99, 103)

	assert.Equal(t, 2, len(topbook))
	assert.Equal(t, uint64(100), topbook[0].Timestamp)
	assert.Equal(t, uint64(102), topbook[1].Timestamp)
	assert.Equal(t, 201.0, topbook[0].BestBid)
	assert.Equal(t, 106.0, topbook[0].BestAsk)
	assert.Equal(t, 202.0, topbook[1].BestBid)
	assert.Equal(t, 102.0, topbook[1].BestAsk)
}

// TestTopBookBefore : Tests the case where points are created before the first message
func TestTopBookBefore(t *testing.T) {
	setupEmpty()
	messages = []*Message{
		MakeMsg(DirectionAsk, Price(106.0), Timestamp(98)),
		MakeMsg(DirectionAsk, Price(200.0), Timestamp(98)),
		MakeMsg(DirectionBid, Price(101.0), Timestamp(98)),
		MakeMsg(DirectionBid, Price(201.0), Timestamp(98)),
		MakeMsg(DirectionAsk, Price(108.0), Timestamp(101)),
		MakeMsg(DirectionAsk, Price(200.0), Timestamp(101)),
		MakeMsg(DirectionBid, Price(101.0), Timestamp(101)),
		MakeMsg(DirectionBid, Price(201.0), Timestamp(101)),
		MakeMsg(DirectionAsk, Price(102.0), Timestamp(102)),
		MakeMsg(DirectionAsk, Price(201.0), Timestamp(102)),
		MakeMsg(DirectionBid, Price(101.0), Timestamp(102)),
		MakeMsg(DirectionBid, Price(202.0), Timestamp(102)),
	}

	pointDistance := 2
	topbook := orderbook.TopBookPerXNano(messages, uint64(pointDistance), 99, 103)

	assert.Equal(t, 3, len(topbook))
	assert.Equal(t, uint64(98), topbook[0].Timestamp)
	assert.Equal(t, uint64(100), topbook[1].Timestamp)
	assert.Equal(t, uint64(102), topbook[2].Timestamp)
	assert.Equal(t, 201.0, topbook[0].BestBid)
	assert.Equal(t, 106.0, topbook[0].BestAsk)
	assert.Equal(t, 201.0, topbook[1].BestBid)
	assert.Equal(t, 106.0, topbook[1].BestAsk)
	assert.Equal(t, 202.0, topbook[2].BestBid)
	assert.Equal(t, 102.0, topbook[2].BestAsk)
}

// TestTopBookBetween : Tests the case where points are created between messages
func TestTopBookBetween(t *testing.T) {
	setupEmpty()
	messages = []*Message{
		MakeMsg(DirectionAsk, Price(106.0), Timestamp(100)),
		MakeMsg(DirectionAsk, Price(200.0), Timestamp(100)),
		MakeMsg(DirectionBid, Price(101.0), Timestamp(100)),
		MakeMsg(DirectionBid, Price(201.0), Timestamp(100)),
		MakeMsg(DirectionAsk, Price(108.0), Timestamp(101)),
		MakeMsg(DirectionAsk, Price(200.0), Timestamp(101)),
		MakeMsg(DirectionBid, Price(101.0), Timestamp(101)),
		MakeMsg(DirectionBid, Price(202.0), Timestamp(101)),
		MakeMsg(DirectionAsk, Price(102.0), Timestamp(105)),
		MakeMsg(DirectionAsk, Price(201.0), Timestamp(105)),
		MakeMsg(DirectionBid, Price(101.0), Timestamp(105)),
		MakeMsg(DirectionBid, Price(203.0), Timestamp(105)),
	}

	pointDistance := 1
	topbook := orderbook.TopBookPerXNano(messages, uint64(pointDistance), 100, 105)

	assert.Equal(t, 6, len(topbook))
	assert.Equal(t, uint64(100), topbook[0].Timestamp)
	assert.Equal(t, uint64(101), topbook[1].Timestamp)
	assert.Equal(t, uint64(102), topbook[2].Timestamp)
	assert.Equal(t, uint64(103), topbook[3].Timestamp)
	assert.Equal(t, uint64(104), topbook[4].Timestamp)
	assert.Equal(t, uint64(105), topbook[5].Timestamp)
	assert.Equal(t, 201.0, topbook[0].BestBid)
	assert.Equal(t, 106.0, topbook[0].BestAsk)
	assert.Equal(t, 202.0, topbook[1].BestBid)
	assert.Equal(t, 106.0, topbook[1].BestAsk)
	assert.Equal(t, 202.0, topbook[2].BestBid)
	assert.Equal(t, 106.0, topbook[2].BestAsk)
	assert.Equal(t, 202.0, topbook[3].BestBid)
	assert.Equal(t, 106.0, topbook[3].BestAsk)
	assert.Equal(t, 202.0, topbook[4].BestBid)
	assert.Equal(t, 106.0, topbook[4].BestAsk)
	assert.Equal(t, 203.0, topbook[5].BestBid)
	assert.Equal(t, 102.0, topbook[5].BestAsk)
}

// TestTopBookAfter : Tests the case where points are created after the last message
func TestTopBookAfter(t *testing.T) {
	setupEmpty()
	messages = []*Message{
		MakeMsg(DirectionAsk, Price(106.0), Timestamp(100)),
		MakeMsg(DirectionAsk, Price(200.0), Timestamp(100)),
		MakeMsg(DirectionBid, Price(101.0), Timestamp(100)),
		MakeMsg(DirectionBid, Price(201.0), Timestamp(100)),
		MakeMsg(DirectionAsk, Price(108.0), Timestamp(101)),
		MakeMsg(DirectionAsk, Price(200.0), Timestamp(101)),
		MakeMsg(DirectionBid, Price(101.0), Timestamp(101)),
		MakeMsg(DirectionBid, Price(202.0), Timestamp(101)),
		MakeMsg(DirectionAsk, Price(102.0), Timestamp(102)),
		MakeMsg(DirectionAsk, Price(201.0), Timestamp(102)),
		MakeMsg(DirectionBid, Price(101.0), Timestamp(102)),
		MakeMsg(DirectionBid, Price(203.0), Timestamp(102)),
	}

	pointDistance := 2
	topbook := orderbook.TopBookPerXNano(messages, uint64(pointDistance), 99, 106)

	assert.Equal(t, 4, len(topbook))
	assert.Equal(t, uint64(100), topbook[0].Timestamp)
	assert.Equal(t, uint64(102), topbook[1].Timestamp)
	assert.Equal(t, uint64(104), topbook[2].Timestamp)
	assert.Equal(t, uint64(106), topbook[3].Timestamp)
	assert.Equal(t, 201.0, topbook[0].BestBid)
	assert.Equal(t, 106.0, topbook[0].BestAsk)
	assert.Equal(t, 203.0, topbook[1].BestBid)
	assert.Equal(t, 102.0, topbook[1].BestAsk)
	assert.Equal(t, 203.0, topbook[2].BestBid)
	assert.Equal(t, 102.0, topbook[2].BestAsk)
	assert.Equal(t, 203.0, topbook[3].BestBid)
	assert.Equal(t, 102.0, topbook[3].BestAsk)
}

func TestMessagesZero(t *testing.T) {
	setupExistingOrders()
	pointDistance := uint64(2)
	topbook := orderbook.TopBookPerXNano([]*Message{}, pointDistance, 100, 105)

	assert.Equal(t, 3, len(topbook))
	assert.Equal(t, uint64(100), topbook[0].Timestamp)
	assert.Equal(t, uint64(102), topbook[1].Timestamp)
	assert.Equal(t, uint64(104), topbook[2].Timestamp)
}
