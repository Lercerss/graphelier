package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewOrderBidsSamePrice(t *testing.T) {
	orderbook := Orderbook{Instrument: "test", Asks: make([]*Level, 0), Bids: make([]*Level, 0), Timestamp: uint64(1), LastSodOffset: uint64(1)}
	newOrder := Message{OrderID: uint64(1), Type: NewOrder, Price: 1.0, ShareQuantity: uint64(2), Timestamp: uint64(1), SodOffset: uint64(1), Direction: 1}
	newOrder2 := Message{OrderID: uint64(2), Type: NewOrder, Price: 1.0, ShareQuantity: uint64(3), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}
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
	newOrder := Message{OrderID: uint64(1), Type: NewOrder, Price: 1.0, ShareQuantity: uint64(2), Timestamp: uint64(1), SodOffset: uint64(1), Direction: 1}
	newOrder2 := Message{OrderID: uint64(2), Type: NewOrder, Price: 2.0, ShareQuantity: uint64(3), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}
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
	newOrder := Message{OrderID: uint64(1), Type: NewOrder, Price: 1.0, ShareQuantity: uint64(2), Timestamp: uint64(1), SodOffset: uint64(1), Direction: -1}
	newOrder2 := Message{OrderID: uint64(2), Type: NewOrder, Price: 1.0, ShareQuantity: uint64(3), Timestamp: uint64(1), SodOffset: uint64(2), Direction: -1}
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

	deleteOrder := Message{OrderID: uint64(2), Type: Delete, Price: 1.0, ShareQuantity: uint64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}

	messages := make([]*Message, 0)
	messages = append(messages, &deleteOrder)

	orderbook.ApplyMessagesToOrderbook(messages)
	actualPriceLevel := orderbook.Bids[0]
	assert.Equal(t, 1.0, actualPriceLevel.Price)
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking priority is kept
	assert.EqualValues(t, 1, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 3, actualPriceLevel.Orders[1].ID)

	continuingMessages := make([]*Message, 0)
	deleteOrder1 := Message{OrderID: uint64(1), Type: Delete, Price: 1.0, ShareQuantity: uint64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}
	deleteOrder3 := Message{OrderID: uint64(3), Type: Delete, Price: 1.0, ShareQuantity: uint64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}

	continuingMessages = append(messages, &deleteOrder1, &deleteOrder3)
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

	deleteOrder := Message{OrderID: uint64(2), Type: Delete, Price: 1.0, ShareQuantity: uint64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: -1}

	messages := make([]*Message, 0)
	messages = append(messages, &deleteOrder)

	orderbook.ApplyMessagesToOrderbook(messages)
	actualPriceLevel := orderbook.Asks[0]
	assert.Equal(t, 1.0, actualPriceLevel.Price)
	assert.Equal(t, 2, len(actualPriceLevel.Orders))

	// Checking priority is kept
	assert.EqualValues(t, 1, actualPriceLevel.Orders[0].ID)
	assert.EqualValues(t, 3, actualPriceLevel.Orders[1].ID)

	continuingMessages := make([]*Message, 0)
	deleteOrder1 := Message{OrderID: uint64(1), Type: Delete, Price: 1.0, ShareQuantity: uint64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: -1}
	deleteOrder3 := Message{OrderID: uint64(3), Type: Delete, Price: 1.0, ShareQuantity: uint64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: -1}

	continuingMessages = append(messages, &deleteOrder1, &deleteOrder3)
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

	modifyOrder1 := Message{OrderID: uint64(1), Type: Modify, Price: 1.0, ShareQuantity: uint64(2), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}
	// This modify simply removes the order
	modifyOrder2 := Message{OrderID: uint64(2), Type: Modify, Price: 1.0, ShareQuantity: uint64(6), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}

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

	executeOrder1 := Message{OrderID: uint64(1), Type: Execute, Price: 1.0, ShareQuantity: uint64(1), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}
	executeOrder2 := Message{OrderID: uint64(2), Type: Execute, Price: 1.0, ShareQuantity: uint64(1), Timestamp: uint64(1), SodOffset: uint64(2), Direction: 1}

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
