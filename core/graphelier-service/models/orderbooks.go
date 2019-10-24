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
	Instrument string   `json:"instrument"`
	Bids       []*Level `json:"bids"`
	Asks       []*Level `json:"asks"`
	Timestamp  uint64   `json:"timestamp"`
}

// ApplyMessagesToOrderbook : Applies each individual message to the orderbook
func (orderbook *Orderbook) ApplyMessagesToOrderbook(messages []*Message) *Orderbook {
	for _, message := range messages {
		if message.OrderID == 0 {
			continue
		}
		switch MessageType(message.MessageType) {
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
	}

	return orderbook
}

func (orderbook *Orderbook) applyNewOrder(message *Message) {
	order := &Order{message.OrderID, message.ShareQuantity}
	if message.Direction == -1 {
		index, found := getLevelIndex(orderbook.Asks, message)
		if !found {
			level := &Level{message.Price, []*Order{order}}
			orderbook.Asks = append(orderbook.Asks, nil)
			copy(orderbook.Asks[index+1:], orderbook.Asks[index:])
			orderbook.Asks[index] = level
		} else {
			orderbook.Asks[index].Orders = append(orderbook.Asks[index].Orders, order)
		}
	} else if message.Direction == 1 {
		index, found := getLevelIndex(orderbook.Bids, message)
		if !found {
			level := &Level{message.Price, []*Order{order}}
			orderbook.Bids = append(orderbook.Bids, nil)
			copy(orderbook.Bids[index+1:], orderbook.Bids[index:])
			orderbook.Bids[index] = level
		} else {
			orderbook.Bids[index].Orders = append(orderbook.Bids[index].Orders, order)
		}
	}
}

func (orderbook *Orderbook) applyModify(message *Message) {
	orders, orderIndex := getOrders(orderbook, message)
	if orderIndex < 0 || orders == nil {
		return
	}

	o := (*orders)[orderIndex]
	if message.ShareQuantity < o.Quantity {
		o.Quantity -= message.ShareQuantity
	} else {
		orderbook.applyDelete(message)
		message.ShareQuantity = o.Quantity - message.ShareQuantity
		orderbook.applyNewOrder(message)
	}
}

func (orderbook *Orderbook) applyDelete(message *Message) {
	orders, orderIndex := getOrders(orderbook, message)
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
	orders, orderIndex := getOrders(orderbook, message)
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
	index := 0
	var found bool
	if message.Direction == -1 {
		index, found = getLevelIndex(orderbook.Asks, message)
		if !found {
			return
		}
		copy(orderbook.Asks[index:], orderbook.Asks[index+1:])
		orderbook.Asks[len(orderbook.Asks)-1] = nil
		orderbook.Asks = orderbook.Asks[:len(orderbook.Asks)-1]
	} else if message.Direction == 1 {
		index, found = getLevelIndex(orderbook.Bids, message)
		if !found {
			return
		}
		copy(orderbook.Bids[index:], orderbook.Bids[index+1:])
		orderbook.Bids[len(orderbook.Bids)-1] = nil
		orderbook.Bids = orderbook.Bids[:len(orderbook.Bids)-1]
	}
}

func getLevelIndex(levels []*Level, message *Message) (int, bool) {
	// TODO Should use binary search here... since price-levels are sorted!
	i := 0
	var lastPrice float64
	for ; i < len(levels); i++ {
		lastPrice = levels[i].Price
		if lastPrice >= message.Price {
			break
		}
	}

	return i, lastPrice == message.Price
}

func getOrderIndex(orders []*Order, message *Message) (int, bool) {
	i := 0
	var lastID uint64
	for ; i < len(orders); i++ {
		lastID = orders[i].ID
		if lastID >= message.OrderID {
			break
		}
	}

	return i, lastID == message.OrderID
}

func getOrders(orderbook *Orderbook, message *Message) (*[]*Order, int) {
	orderIndex := 0
	var orders *[]*Order
	if message.Direction == -1 {
		levelIndex, found := getLevelIndex(orderbook.Asks, message)
		if !found {
			return nil, -1
		}
		orderIndex, found = getOrderIndex(orderbook.Asks[levelIndex].Orders, message)
		if !found {
			return nil, -1
		}
		orders = &orderbook.Asks[levelIndex].Orders
	} else if message.Direction == 1 {
		levelIndex, found := getLevelIndex(orderbook.Bids, message)
		if !found {
			return nil, -1
		}
		orderIndex, found = getOrderIndex(orderbook.Bids[levelIndex].Orders, message)
		if !found {
			return nil, -1
		}
		orders = &orderbook.Bids[levelIndex].Orders
	}

	return orders, orderIndex
}
