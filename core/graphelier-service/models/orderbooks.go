package models

// Order : A struct that represents a single bid or ask order in the orderbook
type Order struct {
	ID       uint64 `json:"id" bson:"id"`
	Quantity uint64 `json:"quantity"`
}

// Level : A struct that represents a bid or an ask
type Level struct {
	Price  float64  `json:"price"`
	Orders []*Order `json:"orders"`
}

// Orderbook : A struct that represents the entire orderbook to send as json
type Orderbook struct {
	Instrument    string   `json:"instrument"`
	Bids          []*Level `json:"bids,omitempty"`
	Asks          []*Level `json:"asks,omitempty"`
	Timestamp     uint64   `json:"timestamp"`
	LastSodOffset uint64   `json:"last_sod_offset" bson:"last_sod_offset"`
}

// ApplyMessages : Applies each individual message to the orderbook
func (orderbook *Orderbook) ApplyMessages(messages []*Message) *Orderbook {
	for _, message := range messages {
		if message.OrderID == 0 {
			continue
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
		orderbook.Timestamp = message.Timestamp
		orderbook.LastSodOffset = message.SodOffset
	}

	return orderbook
}

func (orderbook *Orderbook) applyNewOrder(message *Message) {
	if message.ShareQuantity == 0 {
		return
	}
	order := &Order{message.OrderID, message.ShareQuantity}
	index, found := orderbook.getLevelIndex(message)
	if !found {
		if MessageDirection(message.Direction) == Asks {
			level := &Level{message.Price, []*Order{order}}
			orderbook.Asks = append(orderbook.Asks, nil)
			copy(orderbook.Asks[index+1:], orderbook.Asks[index:])
			orderbook.Asks[index] = level
		} else if MessageDirection(message.Direction) == Bids {
			level := &Level{message.Price, []*Order{order}}
			orderbook.Bids = append(orderbook.Bids, nil)
			copy(orderbook.Bids[index+1:], orderbook.Bids[index:])
			orderbook.Bids[index] = level
		}
	} else {
		if MessageDirection(message.Direction) == Asks {
			orderbook.Asks[index].Orders = append(orderbook.Asks[index].Orders, order)
		} else if MessageDirection(message.Direction) == Bids {
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

	if MessageDirection(message.Direction) == Asks {
		copy(orderbook.Asks[index:], orderbook.Asks[index+1:])
		orderbook.Asks[len(orderbook.Asks)-1] = nil
		orderbook.Asks = orderbook.Asks[:len(orderbook.Asks)-1]
	} else if MessageDirection(message.Direction) == Bids {
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
	if MessageDirection(message.Direction) == Asks {
		levels = orderbook.Asks
	} else if MessageDirection(message.Direction) == Bids {
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
	if MessageDirection(message.Direction) == Asks {
		orders = orderbook.Asks[index].Orders
	} else if MessageDirection(message.Direction) == Bids {
		orders = orderbook.Bids[index].Orders
	} else {
		return -1, false
	}

	for ; i < len(orders); i++ {
		lastID = orders[i].ID
		if lastID >= message.OrderID {
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

	if MessageDirection(message.Direction) == Asks {
		orders = &orderbook.Asks[levelIndex].Orders
	} else if MessageDirection(message.Direction) == Bids {
		orders = &orderbook.Bids[levelIndex].Orders
	}

	return orders, orderIndex
}

// BuildDeltabook : Builds a new orderbook with only the delta given from the offset message
func (orderbook *Orderbook) BuildDeltabook(message *Message) *Orderbook {
	index, found := orderbook.getLevelIndex(message)
	deltabook := &Orderbook{}
	if !found {
		level := &Level{Price: message.Price, Orders: []*Order{}}
		if MessageDirection(message.Direction) == Asks {
			deltabook.Asks = append(deltabook.Asks, level)
		} else if MessageDirection(message.Direction) == Bids {
			deltabook.Bids = append(deltabook.Bids, level)
		}
	} else {
		if MessageDirection(message.Direction) == Asks {
			deltabook.Asks = append(deltabook.Asks, orderbook.Asks[index])
		} else if MessageDirection(message.Direction) == Bids {
			deltabook.Bids = append(deltabook.Bids, orderbook.Bids[index])
		}
	}
	deltabook.Instrument = orderbook.Instrument
	deltabook.Timestamp = orderbook.Timestamp
	deltabook.LastSodOffset = orderbook.LastSodOffset

	return deltabook
}
