package models

// OrderInfo stores all information pertaining to an order
type OrderInfo struct {
	Instrument            string      `json:"instrument"`
	ID                    int64       `json:"id"`
	Quantity              int64       `json:"quantity"`
	LastModifiedTimestamp uint64      `json:"last_modified,string"`
	CreatedOn             uint64      `json:"created_on,string"`
	Messages              *[]*Message `json:"messages"`
	Price                 float64     `json:"price"`
}

// OrderInfoBuilder builds the OrderInfo from a list of messages
type OrderInfoBuilder struct {
	id         int64
	instrument string
	timestamp  uint64
	messages   *[]*Message
}

// WithInstrument specifies the instrument the order belongs to
func (builder *OrderInfoBuilder) WithInstrument(instrument string) *OrderInfoBuilder {
	builder.instrument = instrument
	return builder
}

// WithMessages specifies the messages modifying the order
func (builder *OrderInfoBuilder) WithMessages(messages *[]*Message) *OrderInfoBuilder {
	builder.messages = messages
	return builder
}

// WithID specifies the ID of the order
func (builder *OrderInfoBuilder) WithID(ID int64) *OrderInfoBuilder {
	builder.id = ID
	return builder
}

// WithTimestamp specifies the timestamp of the snapshot of the order
func (builder *OrderInfoBuilder) WithTimestamp(timestamp uint64) *OrderInfoBuilder {
	builder.timestamp = timestamp
	return builder
}

// Build builds the OrderInfo based off a slice of mesages, order id, timestamp and instrument
func (builder *OrderInfoBuilder) Build() *OrderInfo {
	orderInfo := OrderInfo{ID: builder.id, Instrument: builder.instrument, Messages: builder.messages}
	for _, message := range *builder.messages {
		if message.Timestamp > builder.timestamp {
			break
		}
		if message.Type == Ignore {
			continue
		}
		orderInfo.LastModifiedTimestamp = message.Timestamp

		if message.Type == NewOrder {
			orderInfo.Quantity = message.ShareQuantity
			orderInfo.Price = message.Price
			orderInfo.CreatedOn = message.Timestamp
		} else if message.Type == Modify || message.Type == Execute {
			orderInfo.Quantity -= message.ShareQuantity
		} else if message.Type == Delete {
			orderInfo.Quantity = 0
		}
	}
	return &orderInfo
}
