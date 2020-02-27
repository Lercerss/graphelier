package models

type Modification struct {
	Type     string   `json:"type"`
	Offset   uint64   `json:"offset"`
	OrderID  uint64   `json:"order_id"`
	Price    *float64 `json:"price,omitempty"`
	Quantity *int64   `json:"quantity,omitempty"`
	NewID    *uint64  `json:"index,omitempty"`
	From     *float64 `json:"from,omitempty"`
	To       *float64 `json:"to,omitempty"`
}

type Modifications struct {
	Timestamp     uint64          `json:"timestamp,string"`
	Modifications []*Modification `json:"modifications"`
}

func (m *Modifications) Add(modification *Modification, timestamp uint64) {
	modification.Offset = timestamp - m.Timestamp
	m.Modifications = append(m.Modifications, modification)
}

const (
	ADD_ORDER_TYPE    = "add"
	DROP_ORDER_TYPE   = "drop"
	UPDATE_ORDER_TYPE = "update"
	MOVE_ORDER_TYPE   = "move"
)

func NewModification(messages []*Message, currentMessage int) *Modification {
	if isMoveModification(messages, currentMessage) {
		before := messages[currentMessage-1]
		after := messages[currentMessage]
		return &Modification{
			Type:    MOVE_ORDER_TYPE,
			To:      &after.Price,
			From:    &before.Price,
			NewID:   &after.OrderID,
			OrderID: before.OrderID,
		}
	}
	if isSkippable(messages, currentMessage) {
		return nil
	}
	modification := &Modification{}
	message := messages[currentMessage]
	switch message.Type {
	case NewOrder:
		modification.Type = ADD_ORDER_TYPE
		modification.Quantity = &message.ShareQuantity
	case Modify:
		modification.Type = UPDATE_ORDER_TYPE
		modification.Quantity = &message.ShareQuantity
	case Delete:
		modification.Type = DROP_ORDER_TYPE
	case Execute:
		modification.Type = UPDATE_ORDER_TYPE
		modification.Quantity = &message.ShareQuantity
	default:
		return nil
	}
	modification.OrderID = message.OrderID
	modification.Price = &message.Price
	return modification
}

func isMoveModification(messages []*Message, currentMessage int) bool {
	if currentMessage == 0 {
		return false
	}
	before := messages[currentMessage-1]
	after := messages[currentMessage]
	return after.Type == NewOrder &&
		before.Type == Delete &&
		before.Price != after.Price &&
		before.ShareQuantity == after.ShareQuantity
}

func isSkippable(messages []*Message, currentMessage int) bool {
	return currentMessage != len(messages)-1 &&
		isMoveModification(messages, currentMessage+1)
}
