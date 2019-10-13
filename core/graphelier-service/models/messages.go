package models

// Message : A struct to hold message data to send a json
type Message struct {
	Instrument    string  `json:"instrument"`
	Timestamp     uint64  `json:"timestamp"`
	MessageType   uint64  `json:"message_type" bson:"message_type"`
	OrderID       uint64  `json:"order_id" bson:"order_id"`
	ShareQuantity uint64  `json:"share_qty" bson:"share_quantity"`
	Price         float64 `json:"price"`
	Direction     int64   `json:"direction"`
}

// MessageHandlers : Enum for message types
type MessageHandlers int

// Values for enum
const (
	NewOrder MessageHandlers = 1
	Modify   MessageHandlers = 2
	Delete   MessageHandlers = 3
	Execute  MessageHandlers = 4
	Ignore   MessageHandlers = 5
)
