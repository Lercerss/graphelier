package models

// Message : A struct to hold message data to send a json
type Message struct {
	Instrument    string      `json:"instrument"`
	Timestamp     uint64      `json:"timestamp"`
	Type          MessageType `json:"message_type" bson:"message_type"`
	OrderID       uint64      `json:"order_id" bson:"order_id"`
	ShareQuantity uint64      `json:"share_qty" bson:"share_quantity"`
	Price         float64     `json:"price"`
	Direction     int64       `json:"direction"`
	SodOffset     uint64      `json:"sod_offset" bson:"sod_offset"`
}

// MessageType : Enum for message types
type MessageType uint64

// MessageDirection : Enum for message direction indicating a bid or ask
type MessageDirection int

// Values for enum
const (
	NewOrder MessageType = 1
	Modify   MessageType = 2
	Delete   MessageType = 3
	Execute  MessageType = 4
	Ignore   MessageType = 5

	Asks MessageDirection = -1
	Bids MessageDirection = 1
)

// MessagePage is a list of messages along with pagination information
type MessagePage struct {
	PageInfo Paginator  `json:"pageInfo"`
	Messages []*Message `json:"messages"`
}
