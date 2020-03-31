package models

import (
	"graphelier/core/graphelier-service/utils"
)

// Order : A struct that represents a single bid or ask order in the orderbook
type Order struct {
	ID       uint64 `json:"id" bson:"id"`
	Quantity int64  `json:"quantity"`
}

// Level : A struct that represents a bid or an ask
type Level struct {
	Price  float64  `json:"price"`
	Orders []*Order `json:"orders"`
}

// Orderbook : A struct that represents the entire orderbook to send as json
type Orderbook struct {
	Instrument    string   `json:"instrument"`
	Bids          []*Level `json:"bids"`
	Asks          []*Level `json:"asks"`
	Timestamp     uint64   `json:"timestamp,string" bson:"interval_multiple"`
	LastSodOffset uint64   `json:"last_sod_offset,string" bson:"last_sod_offset"`
}

// ApplyMessagesToOrderbook : Applies each individual message to the orderbook
func (orderbook *Orderbook) ApplyMessagesToOrderbook(messages []*Message) {
	for _, message := range messages {
		orderbook.ApplyMessage(message)
	}
}

// ApplyMessage : Based on the message type, modifies the orders on the book
func (orderbook *Orderbook) ApplyMessage(message *Message) {
	orderbook.Timestamp = message.Timestamp
	orderbook.LastSodOffset = message.SodOffset
	if message.OrderID == 0 {
		return
	}
	switch message.Type {
	case NewOrder:
		orderbook.applyNewOrder(message)
	case Modify:
		orderbook.applyModify(message)
	case Delete:
		orderbook.applyDelete(message)
	case Execute:
		orderbook.applyExecute(message)
	case Ignore:
		// Pass
	}
}

func (orderbook *Orderbook) applyNewOrder(message *Message) {
	if message.ShareQuantity == 0 {
		return
	}
	order := &Order{message.OrderID, message.ShareQuantity}
	index, found := orderbook.getLevelIndex(message)
	if !found {
		if message.Direction == Asks {
			level := &Level{message.Price, []*Order{order}}
			orderbook.Asks = append(orderbook.Asks, nil)
			copy(orderbook.Asks[index+1:], orderbook.Asks[index:])
			orderbook.Asks[index] = level
		} else if message.Direction == Bids {
			level := &Level{message.Price, []*Order{order}}
			orderbook.Bids = append(orderbook.Bids, nil)
			copy(orderbook.Bids[index+1:], orderbook.Bids[index:])
			orderbook.Bids[index] = level
		}
	} else {
		if message.Direction == Asks {
			orderbook.Asks[index].Orders = append(orderbook.Asks[index].Orders, order)
		} else if message.Direction == Bids {
			orderbook.Bids[index].Orders = append(orderbook.Bids[index].Orders, order)
		}
	}
}

func (orderbook *Orderbook) applyModify(message *Message) {
	orders, orderIndex := orderbook.getOrders(message)
	if orderIndex < 0 || orders == nil {
		return
	}

	o := (*orders)[orderIndex]
	if message.ShareQuantity >= 0 && message.ShareQuantity < o.Quantity {
		o.Quantity -= message.ShareQuantity
	} else {
		orderbook.applyDelete(message)
		message.ShareQuantity = o.Quantity - message.ShareQuantity
		orderbook.applyNewOrder(message)
	}
}

func (orderbook *Orderbook) applyDelete(message *Message) {
	orders, orderIndex := orderbook.getOrders(message)
	if orderIndex < 0 || orders == nil {
		return
	}
	copy((*orders)[orderIndex:], (*orders)[orderIndex+1:])
	(*orders)[len(*orders)-1] = nil
	*orders = (*orders)[:len(*orders)-1]
	if len(*orders) == 0 {
		orderbook.removeEmptyLevel(message)
	}
}

func (orderbook *Orderbook) applyExecute(message *Message) {
	orders, orderIndex := orderbook.getOrders(message)
	if orderIndex < 0 || orders == nil {
		return
	}
	if (*orders)[orderIndex].Quantity > message.ShareQuantity {
		(*orders)[orderIndex].Quantity -= message.ShareQuantity
	} else {
		orderbook.applyDelete(message)
	}
}

func (orderbook *Orderbook) removeEmptyLevel(message *Message) {
	index, found := orderbook.getLevelIndex(message)
	if !found {
		return
	}

	if message.Direction == Asks {
		copy(orderbook.Asks[index:], orderbook.Asks[index+1:])
		orderbook.Asks[len(orderbook.Asks)-1] = nil
		orderbook.Asks = orderbook.Asks[:len(orderbook.Asks)-1]
	} else if message.Direction == Bids {
		copy(orderbook.Bids[index:], orderbook.Bids[index+1:])
		orderbook.Bids[len(orderbook.Bids)-1] = nil
		orderbook.Bids = orderbook.Bids[:len(orderbook.Bids)-1]
	}
}

func (orderbook *Orderbook) getLevelIndex(message *Message) (int, bool) {
	// TODO Should use binary search here... since price-levels are sorted!
	i := 0
	var lastPrice float64
	var levels []*Level
	// TODO: Should probably change these if-else statements to match the factoy design pattern
	if message.Direction == Asks {
		levels = orderbook.Asks
	} else if message.Direction == Bids {
		levels = orderbook.Bids
	} else {
		return -1, false
	}

	for ; i < len(levels); i++ {
		lastPrice = levels[i].Price
		if message.Direction == -1 && lastPrice >= message.Price {
			break
		}
		if message.Direction == 1 && lastPrice <= message.Price {
			break
		}
	}

	return i, lastPrice == message.Price
}

func (orderbook *Orderbook) getOrderIndex(index int, message *Message) (int, bool) {
	i := 0
	var lastID uint64
	var orders []*Order
	if message.Direction == Asks {
		orders = orderbook.Asks[index].Orders
	} else if message.Direction == Bids {
		orders = orderbook.Bids[index].Orders
	} else {
		return -1, false
	}

	for ; i < len(orders); i++ {
		lastID = orders[i].ID
		if lastID == message.OrderID {
			break
		}
	}

	return i, lastID == message.OrderID
}

func (orderbook *Orderbook) getOrders(message *Message) (*[]*Order, int) {
	var orders *[]*Order
	levelIndex, found := orderbook.getLevelIndex(message)
	if !found {
		return nil, -1
	}
	orderIndex, found := orderbook.getOrderIndex(levelIndex, message)
	if !found {
		return nil, -1
	}

	if message.Direction == Asks {
		orders = &orderbook.Asks[levelIndex].Orders
	} else if message.Direction == Bids {
		orders = &orderbook.Bids[levelIndex].Orders
	}

	return orders, orderIndex
}

// BuildDeltabook : Builds a new orderbook with only the delta given from the offset message
func (orderbook *Orderbook) BuildDeltabook(deltabook *Orderbook, message *Message, numMessages int64) {
	oIndex, oFound := orderbook.getLevelIndex(message)
	dIndex, dFound := deltabook.getLevelIndex(message)
	if !oFound {
		emptyLevel := &Level{Price: message.Price, Orders: []*Order{}}
		if !dFound {
			if message.Direction == Asks {
				deltabook.Asks = append(deltabook.Asks, nil)
				copy(deltabook.Asks[dIndex+1:], deltabook.Asks[dIndex:])
				deltabook.Asks[dIndex] = emptyLevel
			} else if message.Direction == Bids {
				deltabook.Bids = append(deltabook.Bids, nil)
				copy(deltabook.Bids[dIndex+1:], deltabook.Bids[dIndex:])
				deltabook.Bids[dIndex] = emptyLevel
			}
		} else {
			if message.Direction == Asks {
				deltabook.Asks[dIndex] = emptyLevel
			} else if message.Direction == Bids {
				deltabook.Bids[dIndex] = emptyLevel
			}
		}
	} else {
		if !dFound {
			if message.Direction == Asks {
				deltabook.Asks = append(deltabook.Asks, nil)
				copy(deltabook.Asks[dIndex+1:], deltabook.Asks[dIndex:])
				deltabook.Asks[dIndex] = orderbook.Asks[oIndex]
			} else if message.Direction == Bids {
				deltabook.Bids = append(deltabook.Bids, nil)
				copy(deltabook.Bids[dIndex+1:], deltabook.Bids[dIndex:])
				deltabook.Bids[dIndex] = orderbook.Bids[oIndex]
			}
		} else {
			if message.Direction == Asks {
				deltabook.Asks[dIndex].Orders = orderbook.Asks[oIndex].Orders
			} else if message.Direction == Bids {
				deltabook.Bids[dIndex].Orders = orderbook.Bids[oIndex].Orders
			}
		}
	}

}

// ApplyMessagesToDeltabook : Applies messages to build deltabook while also applying the message to the original orderbook
func (orderbook *Orderbook) ApplyMessagesToDeltabook(messages []*Message, numMessages int64) (deltabook *Orderbook) {
	deltabook = &Orderbook{}
	for i := int64(0); i < utils.Abs(numMessages); i++ {
		message := messages[i]
		if numMessages > 0 {
			orderbook.ApplyMessage(message)
		}
		if message.OrderID == 0 || message.Type == Ignore {
			continue
		}
		orderbook.BuildDeltabook(deltabook, message, numMessages)
	}
	deltabook.Instrument = orderbook.Instrument
	deltabook.Timestamp = orderbook.Timestamp
	deltabook.LastSodOffset = orderbook.LastSodOffset

	return
}

// TopBookPerXNano : Returns a list of the top book at every x nanosecond after applying each individual message in a list
func (orderbook *Orderbook) TopBookPerXNano(messages []*Message, pointDistance uint64, startTimestamp uint64, endTimestamp uint64) (topbook []*Point) {
	lastMultipleCount := (startTimestamp - 1) / pointDistance

	// handles points before and between messages
	for _, message := range messages {
		messageMultiple := (message.Timestamp - 1) / pointDistance
		topbook = orderbook.backfillPoints(topbook, pointDistance, lastMultipleCount, messageMultiple)
		lastMultipleCount = messageMultiple
		orderbook.ApplyMessage(message)
	}
	// handles points after messages
	topbook = orderbook.backfillPoints(topbook, pointDistance, lastMultipleCount, endTimestamp/pointDistance)

	return topbook
}

// add points for previous multiples of point distance
func (orderbook *Orderbook) backfillPoints(topbook []*Point, pointDistance uint64, leftMultiple uint64, rightMultiple uint64) []*Point {
	for currentMultiple := leftMultiple; currentMultiple < rightMultiple; currentMultiple++ {
		point := CreatePoint(orderbook, (currentMultiple+1)*pointDistance)
		topbook = append(topbook, &point)
	}
	return topbook
}

// YieldModifications : Generates modifications while applying a list of messages
func (orderbook *Orderbook) YieldModifications(messages []*Message) (modifications *Modifications) {
	modifications = &Modifications{
		Timestamp:     orderbook.Timestamp,
		Modifications: []*Modification{},
	}
	for currentMessage, message := range messages {
		orderbook.Timestamp = message.Timestamp
		orderbook.LastSodOffset = message.SodOffset
		if message.OrderID == 0 {
			continue
		}

		var order *Order = nil
		if orders, index := orderbook.getOrders(message); orders != nil && index >= 0 {
			order = (*orders)[index]
		}
		if modification := NewModification(messages, currentMessage, order); modification != nil {
			modifications.Add(modification, orderbook.Timestamp)
		}
		orderbook.ApplyMessage(message)
	}
	return modifications
}
