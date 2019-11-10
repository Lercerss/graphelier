package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

var orderbook *Orderbook
var deltabook *Orderbook
var messages []*Message

func setup() {
	orderbook = &Orderbook{}
	deltabook = &Orderbook{}
	messages = append(messages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 12, Price: 100, ShareQuantity: 10, Timestamp: 99, SodOffset: 1})
	messages = append(messages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 17, Price: 200, ShareQuantity: 10, Timestamp: 100, SodOffset: 4})
	messages = append(messages, &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 13, Price: 100, ShareQuantity: 10, Timestamp: 99, SodOffset: 2})
	messages = append(messages, &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 20, Price: 200, ShareQuantity: 10, Timestamp: 100, SodOffset: 5})
}

func clear() {
	for k := range messages {
		messages[k] = nil
	}
	messages = messages[:0]
}

func TestNewOrderBidsSamePrice(t *testing.T) {
	orderbook := Orderbook{Instrument: "test", Asks: make([]*Level, 0), Bids: make([]*Level, 0), Timestamp: uint64(1), LastSodOffset: uint64(1)}
	newOrder := Message{OrderID: uint64(1), Type: NewOrder, Price: 1.0, ShareQuantity: int64(2), Timestamp: uint64(1), SodOffset: uint64(1), Direction: 1}
	newOrder2 := Message{OrderID: uint64(2), Type: NewOrder, Price: 1.0, ShareQuantity: int64(3), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}
	messages := make([]*Message, 0)
	messages = append(messages, &newOrder, &newOrder2)

	orderbook.ApplyMessagesToOrderbook(messages)
	actualPriceLevel := orderbook.Bids[0]
	assert.Equal(t, 1.0, actualPriceLevel.Price)
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking priority is kept
	assert.EqualValues(t, 1, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 2, actualPriceLevel.Orders[1].ID)
}

func TestNewOrderBidsAccrossPriceLevels(t *testing.T) {
	orderbook := Orderbook{Instrument: "test", Asks: make([]*Level, 0), Bids: make([]*Level, 0), Timestamp: uint64(1), LastSodOffset: uint64(1)}
	newOrder := Message{OrderID: uint64(1), Type: NewOrder, Price: 1.0, ShareQuantity: int64(2), Timestamp: uint64(1), SodOffset: uint64(1), Direction: 1}
	newOrder2 := Message{OrderID: uint64(2), Type: NewOrder, Price: 2.0, ShareQuantity: int64(3), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}
	messages := make([]*Message, 0)
	messages = append(messages, &newOrder, &newOrder2)

	orderbook.ApplyMessagesToOrderbook(messages)
	actualHighPriceLevel := orderbook.Bids[0]
	actualLowPriceLevel := orderbook.Bids[1]
	assert.Equal(t, 1.0, actualLowPriceLevel.Price)
	assert.Equal(t, 2.0, actualHighPriceLevel.Price)
	assert.Equal(t, 1, len(actualLowPriceLevel.Orders))
	assert.Equal(t, 1, len(actualHighPriceLevel.Orders))

	assert.EqualValues(t, 1, actualLowPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 2, actualHighPriceLevel.Orders[0].ID)
}
func TestNewOrderAsks(t *testing.T) {
	orderbook := Orderbook{Instrument: "test", Asks: make([]*Level, 0), Bids: make([]*Level, 0), Timestamp: uint64(1), LastSodOffset: uint64(1)}
	newOrder := Message{OrderID: uint64(1), Type: NewOrder, Price: 1.0, ShareQuantity: int64(2), Timestamp: uint64(1), SodOffset: uint64(1), Direction: -1}
	newOrder2 := Message{OrderID: uint64(2), Type: NewOrder, Price: 1.0, ShareQuantity: int64(3), Timestamp: uint64(1), SodOffset: uint64(2), Direction: -1}
	messages := make([]*Message, 0)
	messages = append(messages, &newOrder, &newOrder2)

	orderbook.ApplyMessagesToOrderbook(messages)
	actualPriceLevel := orderbook.Asks[0]
	assert.Equal(t, 1.0, actualPriceLevel.Price)
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking priority is kept
	assert.EqualValues(t, 1, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 2, actualPriceLevel.Orders[1].ID)
}

func TestDeleteOrderBids(t *testing.T) {
	orders := make([]*Order, 0)
	orders = append(orders, &Order{ID: 1, Quantity: 2})
	orders = append(orders, &Order{ID: 2, Quantity: 2})
	orders = append(orders, &Order{ID: 3, Quantity: 2})
	priceLevel := Level{Price: 1, Orders: orders}
	priceLevels := make([]*Level, 0)
	priceLevels = append(priceLevels, &priceLevel)
	orderbook := Orderbook{Instrument: "test", Asks: make([]*Level, 0), Bids: priceLevels, Timestamp: uint64(1), LastSodOffset: uint64(1)}

	deleteOrder := Message{OrderID: uint64(2), Type: Delete, Price: 1.0, ShareQuantity: int64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}

	messages := make([]*Message, 0)
	messages = append(messages, &deleteOrder)

	orderbook.ApplyMessagesToOrderbook(messages)
	actualPriceLevel := orderbook.Bids[0]
	assert.Equal(t, 1.0, actualPriceLevel.Price)
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking priority is kept
	assert.EqualValues(t, 1, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 3, actualPriceLevel.Orders[1].ID)

	deleteOrder1 := Message{OrderID: uint64(1), Type: Delete, Price: 1.0, ShareQuantity: int64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}
	deleteOrder3 := Message{OrderID: uint64(3), Type: Delete, Price: 1.0, ShareQuantity: int64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}

	continuingMessages := append(messages, &deleteOrder1, &deleteOrder3)
	orderbook.ApplyMessagesToOrderbook(continuingMessages)
	assert.Equal(t, 0, len(actualPriceLevel.Orders))
}

func TestDeleteOrderAsks(t *testing.T) {
	orders := make([]*Order, 0)
	orders = append(orders, &Order{ID: 1, Quantity: 2})
	orders = append(orders, &Order{ID: 2, Quantity: 2})
	orders = append(orders, &Order{ID: 3, Quantity: 2})
	priceLevel := Level{Price: 1, Orders: orders}
	priceLevels := make([]*Level, 0)
	priceLevels = append(priceLevels, &priceLevel)
	orderbook := Orderbook{Instrument: "test", Asks: priceLevels, Bids: make([]*Level, 0), Timestamp: uint64(1), LastSodOffset: uint64(1)}

	deleteOrder := Message{OrderID: uint64(2), Type: Delete, Price: 1.0, ShareQuantity: int64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: -1}

	messages := make([]*Message, 0)
	messages = append(messages, &deleteOrder)

	orderbook.ApplyMessagesToOrderbook(messages)
	actualPriceLevel := orderbook.Asks[0]
	assert.Equal(t, 1.0, actualPriceLevel.Price)
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking priority is kept
	assert.EqualValues(t, 1, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 3, actualPriceLevel.Orders[1].ID)

	deleteOrder1 := Message{OrderID: uint64(1), Type: Delete, Price: 1.0, ShareQuantity: int64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: -1}
	deleteOrder3 := Message{OrderID: uint64(3), Type: Delete, Price: 1.0, ShareQuantity: int64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: -1}

	continuingMessages := append(messages, &deleteOrder1, &deleteOrder3)
	orderbook.ApplyMessagesToOrderbook(continuingMessages)
	assert.Equal(t, 0, len(actualPriceLevel.Orders))
}

func TestModifyOrder(t *testing.T) {
	orders := make([]*Order, 0)
	orders = append(orders, &Order{ID: 1, Quantity: 3})
	orders = append(orders, &Order{ID: 2, Quantity: 6})
	orders = append(orders, &Order{ID: 3, Quantity: 2})
	priceLevel := Level{Price: 1, Orders: orders}
	priceLevels := make([]*Level, 0)
	priceLevels = append(priceLevels, &priceLevel)
	orderbook := Orderbook{Instrument: "test", Asks: make([]*Level, 0), Bids: priceLevels, Timestamp: uint64(1), LastSodOffset: uint64(1)}

	modifyOrder1 := Message{OrderID: uint64(1), Type: Modify, Price: 1.0, ShareQuantity: int64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}
	// This modify simply removes the order
	modifyOrder2 := Message{OrderID: uint64(2), Type: Modify, Price: 1.0, ShareQuantity: int64(6), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}

	messages := make([]*Message, 0)
	messages = append(messages, &modifyOrder2, &modifyOrder1)

	orderbook.ApplyMessagesToOrderbook(messages)

	actualPriceLevel := orderbook.Bids[0]
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking to see priority hasn't changed
	assert.EqualValues(t, 1, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 3, actualPriceLevel.Orders[1].ID)

	// Checking to see that quantity was modified
	assert.EqualValues(t, 1, actualPriceLevel.Orders[0].Quantity)

}

func TestExecuteOrderBids(t *testing.T) {
	orders := make([]*Order, 0)
	orders = append(orders, &Order{ID: 1, Quantity: 1})
	orders = append(orders, &Order{ID: 2, Quantity: 2})
	orders = append(orders, &Order{ID: 3, Quantity: 2})
	priceLevel := Level{Price: 1, Orders: orders}
	priceLevels := make([]*Level, 0)
	priceLevels = append(priceLevels, &priceLevel)
	orderbook := Orderbook{Instrument: "test", Asks: make([]*Level, 0), Bids: priceLevels, Timestamp: uint64(1), LastSodOffset: uint64(1)}

	executeOrder1 := Message{OrderID: uint64(1), Type: Execute, Price: 1.0, ShareQuantity: int64(1), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}
	executeOrder2 := Message{OrderID: uint64(2), Type: Execute, Price: 1.0, ShareQuantity: int64(1), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}

	messages := make([]*Message, 0)
	messages = append(messages, &executeOrder1, &executeOrder2)

	orderbook.ApplyMessagesToOrderbook(messages)
	actualPriceLevel := orderbook.Bids[0]
	assert.Equal(t, 1.0, actualPriceLevel.Price)
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking priority is kept and orderID=1 is deleted
	assert.EqualValues(t, 2, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 3, actualPriceLevel.Orders[1].ID)

	// Checking to see if orderID=2's share quantity was correctly modified
	assert.EqualValues(t, 1, actualPriceLevel.Orders[0].Quantity)
}

func TestDeltaAskChange(t *testing.T) {
	setup()
	offsetMessage := &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 15, Price: 100, ShareQuantity: 50, Timestamp: 99, SodOffset: 3}
	messages = append(messages, offsetMessage)
	orderbook.ApplyMessagesToOrderbook(messages)
	orderbook.BuildDeltabook(deltabook, offsetMessage, 1)

	assert.Equal(t, uint64(99), deltabook.Timestamp)
	assert.Equal(t, uint64(4), deltabook.LastSodOffset)
	assert.Equal(t, int(1), len(deltabook.Asks))
	assert.Equal(t, int(2), len(deltabook.Asks[0].Orders))
	assert.Equal(t, int64(10), deltabook.Asks[0].Orders[0].Quantity)
	assert.Equal(t, int64(50), deltabook.Asks[0].Orders[1].Quantity)
	assert.Equal(t, int(0), len(deltabook.Bids))
	clear()
}

func TestDeltaBidChange(t *testing.T) {
	setup()
	offsetMessage := &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 15, Price: 100, ShareQuantity: 50, Timestamp: 99, SodOffset: 3}
	messages = append(messages, offsetMessage)
	orderbook.ApplyMessagesToOrderbook(messages)
	orderbook.BuildDeltabook(deltabook, offsetMessage, 1)

	assert.Equal(t, uint64(99), deltabook.Timestamp)
	assert.Equal(t, uint64(4), deltabook.LastSodOffset)
	assert.Equal(t, int(1), len(deltabook.Bids))
	assert.Equal(t, int(2), len(deltabook.Bids[0].Orders))
	assert.Equal(t, int64(10), deltabook.Bids[0].Orders[0].Quantity)
	assert.Equal(t, int64(50), deltabook.Bids[0].Orders[1].Quantity)
	assert.Equal(t, int(0), len(deltabook.Asks))
	clear()
}

func TestEmptyLevel(t *testing.T) {
	setup()
	offsetMessage := &Message{Direction: -1, Instrument: "test", Type: 3, OrderID: 12, Price: 100, ShareQuantity: 10, Timestamp: 99, SodOffset: 3}
	messages = append(messages, offsetMessage)
	orderbook.ApplyMessagesToOrderbook(messages)
	orderbook.BuildDeltabook(deltabook, offsetMessage, 1)

	assert.Equal(t, uint64(99), deltabook.Timestamp)
	assert.Equal(t, uint64(4), deltabook.LastSodOffset)
	assert.Equal(t, int(1), len(deltabook.Asks))
	assert.Equal(t, int(0), len(deltabook.Asks[0].Orders))
	assert.Equal(t, int(0), len(deltabook.Bids))
	clear()
}

func TestApplyDeltaPositiveNumMessages(t *testing.T) {
	setup()
	var messages []*Message
	messages = append(messages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 25, Price: 100, ShareQuantity: 10, Timestamp: 101, SodOffset: 6})
	messages = append(messages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 26, Price: 200, ShareQuantity: 10, Timestamp: 101, SodOffset: 7})
	messages = append(messages, &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 27, Price: 100, ShareQuantity: 10, Timestamp: 101, SodOffset: 8})
	messages = append(messages, &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 28, Price: 200, ShareQuantity: 10, Timestamp: 101, SodOffset: 9})
	orderbook.ApplyMessagesToDeltabook(deltabook, messages, 2)

	assert.Equal(t, int(1), len(deltabook.Asks[0].Orders))
	assert.Equal(t, int(1), len(deltabook.Asks[1].Orders))
	assert.Equal(t, int(0), len(deltabook.Bids))
	clear()
}

func TestApplyDeltaNegativeNumMessages(t *testing.T) {
	setup()
	var messages []*Message
	messages = append(messages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 25, Price: 100, ShareQuantity: 10, Timestamp: 101, SodOffset: 6})
	messages = append(messages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 26, Price: 200, ShareQuantity: 10, Timestamp: 101, SodOffset: 7})
	messages = append(messages, &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 27, Price: 100, ShareQuantity: 10, Timestamp: 101, SodOffset: 8})
	messages = append(messages, &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 28, Price: 200, ShareQuantity: 10, Timestamp: 101, SodOffset: 9})
	orderbook.ApplyMessagesToDeltabook(deltabook, messages, -2)

	assert.Equal(t, int(1), len(deltabook.Asks[0].Orders))
	assert.Equal(t, int(1), len(deltabook.Asks[1].Orders))
	assert.Equal(t, int(0), len(deltabook.Bids))
	clear()
}

func TestDeltaNoOrderIndexNoDeltaIndex(t *testing.T) {
	orderbook := &Orderbook{}
	deltabook := &Orderbook{}
	orderMessages := make([]*Message, 0)
	deltaMessages := make([]*Message, 0)

	orderMessages = append(orderMessages, &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 13, Price: 100, ShareQuantity: 10, Timestamp: 99, SodOffset: 2})
	orderMessages = append(orderMessages, &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 20, Price: 200, ShareQuantity: 10, Timestamp: 100, SodOffset: 5})
	deltaMessages = append(deltaMessages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 12, Price: 100, ShareQuantity: 10, Timestamp: 99, SodOffset: 1})
	deltaMessages = append(deltaMessages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 17, Price: 200, ShareQuantity: 10, Timestamp: 100, SodOffset: 4})

	orderbook.ApplyMessagesToOrderbook(orderMessages)
	deltabook.ApplyMessagesToOrderbook(deltaMessages)
	message := &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 44, Price: 201, ShareQuantity: 10, Timestamp: 100, SodOffset: 10}
	orderbook.BuildDeltabook(deltabook, message, 3)

	assert.NotEqual(t, message.Price, orderbook.Bids[0].Price)
	assert.NotEqual(t, message.Price, orderbook.Bids[1].Price)
	assert.Equal(t, int(2), len(orderbook.Bids))
	assert.Equal(t, int(3), len(deltabook.Asks))
	assert.Equal(t, message.Price, deltabook.Asks[2].Price)

}

func TestDeltaNoOrderIndexDeltaIndex(t *testing.T) {
	orderbook := &Orderbook{}
	deltabook := &Orderbook{}
	orderMessages := make([]*Message, 0)
	deltaMessages := make([]*Message, 0)

	orderMessages = append(orderMessages, &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 13, Price: 200, ShareQuantity: 10, Timestamp: 99, SodOffset: 2})
	orderMessages = append(orderMessages, &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 20, Price: 200, ShareQuantity: 10, Timestamp: 100, SodOffset: 5})
	deltaMessages = append(deltaMessages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 12, Price: 100, ShareQuantity: 10, Timestamp: 99, SodOffset: 1})
	deltaMessages = append(deltaMessages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 17, Price: 200, ShareQuantity: 10, Timestamp: 100, SodOffset: 4})

	orderbook.ApplyMessagesToOrderbook(orderMessages)
	deltabook.ApplyMessagesToOrderbook(deltaMessages)
	message := &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 44, Price: 100, ShareQuantity: 10, Timestamp: 100, SodOffset: 10}
	orderbook.BuildDeltabook(deltabook, message, 3)

	assert.NotEqual(t, message.Price, orderbook.Bids[0].Price)
	assert.Equal(t, int(1), len(orderbook.Bids))
	assert.Equal(t, int(2), len(deltabook.Asks))
	assert.Equal(t, message.Price, deltabook.Asks[0].Price)
	assert.Equal(t, int(0), len(deltabook.Asks[0].Orders))
}

func TestDeltaOrderIndexNoDeltaIndex(t *testing.T) {
	orderbook := &Orderbook{}
	deltabook := &Orderbook{}
	orderMessages := make([]*Message, 0)
	deltaMessages := make([]*Message, 0)

	orderMessages = append(orderMessages, &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 13, Price: 100, ShareQuantity: 10, Timestamp: 99, SodOffset: 2})
	orderMessages = append(orderMessages, &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 20, Price: 200, ShareQuantity: 10, Timestamp: 100, SodOffset: 5})
	deltaMessages = append(deltaMessages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 12, Price: 200, ShareQuantity: 10, Timestamp: 99, SodOffset: 1})
	deltaMessages = append(deltaMessages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 17, Price: 200, ShareQuantity: 10, Timestamp: 100, SodOffset: 4})

	orderbook.ApplyMessagesToOrderbook(orderMessages)
	deltabook.ApplyMessagesToOrderbook(deltaMessages)
	message := &Message{Direction: 1, Instrument: "test", Type: 1, OrderID: 44, Price: 100, ShareQuantity: 10, Timestamp: 100, SodOffset: 10}
	orderbook.BuildDeltabook(deltabook, message, 3)

	assert.Equal(t, int(2), len(orderbook.Bids))
	assert.NotEqual(t, message.Price, deltabook.Asks[0].Price)
	assert.Equal(t, int(1), len(deltabook.Asks))
	assert.Equal(t, message.Price, deltabook.Bids[0].Price)
	assert.Equal(t, int(1), len(deltabook.Bids[0].Orders))
}

func TestDeltaOrderIndexDeltaIndex(t *testing.T) {
	orderbook := &Orderbook{}
	deltabook := &Orderbook{}
	orderMessages := make([]*Message, 0)
	deltaMessages := make([]*Message, 0)

	orderMessages = append(orderMessages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 13, Price: 100, ShareQuantity: 10, Timestamp: 99, SodOffset: 2})
	orderMessages = append(orderMessages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 20, Price: 200, ShareQuantity: 10, Timestamp: 100, SodOffset: 5})
	deltaMessages = append(deltaMessages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 12, Price: 100, ShareQuantity: 10, Timestamp: 99, SodOffset: 1})
	deltaMessages = append(deltaMessages, &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 17, Price: 200, ShareQuantity: 10, Timestamp: 100, SodOffset: 4})

	orderbook.ApplyMessagesToOrderbook(orderMessages)
	deltabook.ApplyMessagesToOrderbook(deltaMessages)
	message := &Message{Direction: -1, Instrument: "test", Type: 1, OrderID: 44, Price: 100, ShareQuantity: 10, Timestamp: 100, SodOffset: 10}
	orderbook.BuildDeltabook(deltabook, message, 3)

	assert.Equal(t, len(orderbook.Asks), len(deltabook.Asks))
	assert.Equal(t, orderbook.Asks[0].Price, deltabook.Asks[0].Price)
	assert.Equal(t, orderbook.Asks[1].Price, deltabook.Asks[1].Price)
	assert.Equal(t, len(orderbook.Asks[0].Orders), len(deltabook.Asks[0].Orders))
	assert.Equal(t, len(orderbook.Asks[1].Orders), len(deltabook.Asks[1].Orders))
}

func TestOrderbookPriceSort(t *testing.T) {
	setup()
	orderbook.ApplyMessagesToOrderbook(messages)

	assert.Equal(t, float64(100), orderbook.Asks[0].Price)
	assert.Equal(t, float64(200), orderbook.Asks[1].Price)
	assert.Equal(t, float64(200), orderbook.Bids[0].Price)
	assert.Equal(t, float64(100), orderbook.Bids[1].Price)
	clear()
}

func TestDeltaPriceSort(t *testing.T) {
	setup()
	orderbook.ApplyMessagesToDeltabook(deltabook, messages, 4)

	assert.Equal(t, float64(100), deltabook.Asks[0].Price)
	assert.Equal(t, float64(200), deltabook.Asks[1].Price)
	assert.Equal(t, float64(200), deltabook.Bids[0].Price)
	assert.Equal(t, float64(100), deltabook.Bids[1].Price)
	clear()
}
