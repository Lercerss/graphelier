package models

// Message : A struct to hold message data
type Message struct {
	Instrument    string  `json:"instrument"`
	Timestamp     float64 `json:"timestamp"`
	MessageType   uint64  `json:"message_type" bson:"message_type"`
	OrderID       uint64  `json:"order_id" bson:"order_id"`
	ShareQuantity uint64  `json:"share_qty" bson:"share_quantity"`
	Price         float64 `json:"price"`
	Direction     int64   `json:"direction"`
}
