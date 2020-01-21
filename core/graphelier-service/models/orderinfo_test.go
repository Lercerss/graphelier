package models_test

import (
	. "graphelier/core/graphelier-service/models"
	. "graphelier/core/graphelier-service/utils/test_utils"
	"testing"

	"github.com/stretchr/testify/assert"
)

var newOrderMessage *Message = MakeMsg(TypeNewOrder, ShareQuantity(11))
var modifyMessage *Message = MakeMsg(TypeModify, ShareQuantity(2), Timestamp(2), SodOffset(2))
var ignoreMessage *Message = MakeMsg(TypeIgnore, Timestamp(3), SodOffset(3))
var executeMessage *Message = MakeMsg(TypeExecute, ShareQuantity(8), Timestamp(4), SodOffset(4))
var deleteMessage *Message = MakeMsg(TypeDelete, Timestamp(5), SodOffset(5))

func TestAllMessages(t *testing.T) {
	// All messages should get applied to the orderInfo

	messages := &[]*Message{newOrderMessage, modifyMessage, ignoreMessage, executeMessage, deleteMessage}
	builder := &OrderInfoBuilder{}

	builder.WithID(1).WithTimestamp(1000).WithMessages(messages).WithInstrument("test")
	orderInfo := builder.Build()

	assert.EqualValues(t, orderInfo.ID, 1)
	assert.EqualValues(t, orderInfo.CreatedOn, 1)
	assert.EqualValues(t, orderInfo.Instrument, "test")
	assert.EqualValues(t, orderInfo.LastModifiedTimestamp, 5)
	assert.EqualValues(t, orderInfo.Messages, messages)
	assert.EqualValues(t, orderInfo.Price, 100)
	assert.EqualValues(t, orderInfo.Quantity, 0)
}

func TestMessagesWithSmallTimestamp(t *testing.T) {
	// All messages with timestamp <= 2 should be applied

	messages := &[]*Message{newOrderMessage, modifyMessage, ignoreMessage, executeMessage}
	builder := &OrderInfoBuilder{}

	builder.WithID(1).WithTimestamp(2).WithMessages(messages).WithInstrument("test")
	orderInfo := builder.Build()

	assert.EqualValues(t, orderInfo.CreatedOn, 1)
	assert.EqualValues(t, orderInfo.Instrument, "test")
	assert.EqualValues(t, orderInfo.LastModifiedTimestamp, 2)
	assert.EqualValues(t, orderInfo.Messages, messages)
	assert.EqualValues(t, orderInfo.Price, 100)
	assert.EqualValues(t, orderInfo.Quantity, 9)
}

func TestIgnoreMessages(t *testing.T) {
	// Ignore messages should not affect anything

	ignore1 := *ignoreMessage
	ignore2 := *ignoreMessage
	ignore2.Timestamp = 4
	ignore3 := *ignoreMessage
	ignore3.Timestamp = 8
	messages := &[]*Message{newOrderMessage, &ignore1, &ignore2, &ignore3}
	builder := &OrderInfoBuilder{}

	builder.WithID(1).WithTimestamp(100).WithMessages(messages).WithInstrument("test")
	orderInfo := builder.Build()

	assert.EqualValues(t, orderInfo.CreatedOn, 1)
	assert.EqualValues(t, orderInfo.Instrument, "test")
	assert.EqualValues(t, orderInfo.LastModifiedTimestamp, 1)
	assert.EqualValues(t, orderInfo.Messages, messages)
	assert.EqualValues(t, orderInfo.Price, 100)
	assert.EqualValues(t, orderInfo.Quantity, 11)
}
