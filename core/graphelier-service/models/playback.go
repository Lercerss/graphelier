package models

// Modification : Represents an event on a specific order, happening at a given offset time
type Modification struct {
	Type      string           `json:"type"`
	Offset    uint64           `json:"offset"`
	OrderID   uint64           `json:"order_id"`
	Direction MessageDirection `json:"direction"`
	Price     *float64         `json:"price,omitempty"`
	Quantity  *int64           `json:"quantity,omitempty"`
	NewID     *uint64          `json:"index,omitempty"`
	From      *float64         `json:"from,omitempty"`
	To        *float64         `json:"to,omitempty"`
}

// Modifications : Holds a list of Modification, starting at a given time
type Modifications struct {
	Timestamp     uint64          `json:"timestamp,string"`
	LastSodOffset uint64          `json:"last_sod_offset,string"`
	Modifications []*Modification `json:"modifications"`
}

// Add : Appends a Modification to the current array
func (m *Modifications) Add(modification *Modification, timestamp uint64, sodOffset uint64) {
	modification.Offset = timestamp - m.Timestamp
	m.LastSodOffset = sodOffset
	m.Modifications = append(m.Modifications, modification)
}

// Modification Type values
const (
	AddOrderType    = "add"
	DropOrderType   = "drop"
	UpdateOrderType = "update"
	MoveOrderType   = "move"
)

// NewModification : Generates a Modification for the message at index `currentMessage` affecting given Order
func NewModification(messages []*Message, currentMessage int, order *Order) *Modification {
	if isMoveModification(messages, currentMessage) {
		before := messages[currentMessage-1]
		after := messages[currentMessage]
		return &Modification{
			Type:      MoveOrderType,
			Direction: after.Direction,
			To:        &after.Price,
			From:      &before.Price,
			NewID:     &after.OrderID,
			OrderID:   before.OrderID,
		}
	}
	if isSkippable(messages, currentMessage, order) {
		return nil
	}
	message := messages[currentMessage]
	modification := &Modification{
		OrderID:   message.OrderID,
		Price:     &message.Price,
		Direction: message.Direction,
	}
	switch message.Type {
	case NewOrder:
		modification.Type = AddOrderType
		modification.Quantity = &message.ShareQuantity
	case Delete:
		modification.Type = DropOrderType
	case Modify:
		modification.fillUpdate(message, order)
	case Execute:
		modification.fillUpdate(message, order)
	default:
		return nil
	}
	return modification
}

// Checks if the message at given index corresponds to a move
// i.e. an order gets deleted then re-created at a different price level at the same timestamp
func isMoveModification(messages []*Message, currentMessage int) bool {
	if currentMessage == 0 {
		return false
	}
	before := messages[currentMessage-1]
	after := messages[currentMessage]
	return after.Type == NewOrder &&
		before.Type == Delete &&
		before.Direction == after.Direction &&
		before.Price != after.Price &&
		before.ShareQuantity == after.ShareQuantity
}

// Checks if the message should generate a modification or be skipped
func isSkippable(messages []*Message, currentMessage int, order *Order) bool {
	return (order == nil && messages[currentMessage].Type != NewOrder) ||
		(currentMessage != len(messages)-1 && isMoveModification(messages, currentMessage+1))
}

func (modification *Modification) fillUpdate(message *Message, order *Order) {
	if message.ShareQuantity < order.Quantity && message.ShareQuantity > 0 {
		// Reducing order size
		modification.Type = UpdateOrderType
		modification.Quantity = new(int64)
		*modification.Quantity = order.Quantity - message.ShareQuantity
	} else if message.ShareQuantity < 0 {
		// Order goes to the back of the price level
		modification.Type = MoveOrderType
		modification.To, modification.From = &message.Price, &message.Price
		modification.Price = nil
		modification.Quantity = new(int64)
		*modification.Quantity = order.Quantity - message.ShareQuantity
	} else {
		// Deleted order
		modification.Type = DropOrderType
	}
}
