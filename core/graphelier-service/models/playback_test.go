package models_test

import (
	. "graphelier/core/graphelier-service/models"
	. "graphelier/core/graphelier-service/utils/test_utils"
	"testing"

	"github.com/stretchr/testify/assert"
)

var pbOrder *Order
var pbMessages []*Message

func setupPB() {
	pbOrder = &Order{ID: 1, Quantity: 100}
	pbMessages = []*Message{
		MakeMsg(),
		MakeMsg(TypeExecute, ShareQuantity(40)),
		MakeMsg(TypeDelete, ShareQuantity(60)),
	}
}

func TestNewModifications(t *testing.T) {
	setupPB()
	// NewOrder msg becomes an AddOrder mod
	result := NewModification(pbMessages, 0, nil)
	assert.Equal(t, AddOrderType, result.Type)
	assert.Equal(t, pbMessages[0].ShareQuantity, *result.Quantity)

	// Execute msg becomes an UpdateOrder mod
	result = NewModification(pbMessages, 1, pbOrder)
	// Apply message to Order
	pbOrder.Quantity -= pbMessages[1].ShareQuantity
	assert.Equal(t, UpdateOrderType, result.Type)
	assert.Equal(t, pbOrder.Quantity, *result.Quantity)

	// Delete msg becomes a DropOrder mod
	result = NewModification(pbMessages, 2, pbOrder)
	assert.Equal(t, DropOrderType, result.Type)
	assert.Nil(t, result.Quantity)
}

func TestMoveModification(t *testing.T) {
	setupPB()
	// Add a NewOrder with same quantity as a delete to form a Move
	pbMessages = append(pbMessages, MakeMsg(ShareQuantity(60), Price(101.0), OrderID(2)))
	// Delete msg is ignored
	result := NewModification(pbMessages, 2, pbOrder)
	assert.Nil(t, result)

	// NewOrder msg becomes a MoveOrder mod
	result = NewModification(pbMessages, 3, nil)
	assert.Equal(t, MoveOrderType, result.Type)
	assert.NotEqual(t, result.OrderID, *result.NewID) // Different ID
	assert.NotEqual(t, *result.To, *result.From)      // Different Price
	assert.Nil(t, result.Quantity)                    // Quantity is unchanged
}

func TestUpdateModificationCases(t *testing.T) {
	setupPB()
	// Increase Execute size to completely fill the order
	pbMessages[1].ShareQuantity = 100
	result := NewModification(pbMessages, 1, pbOrder)
	// Yields a DropOrder instead of an UpdateOrder mod
	assert.Equal(t, DropOrderType, result.Type)
	assert.Nil(t, result.Quantity)

	// Send a negative Modify msg
	pbMessages[1].ShareQuantity = -50
	pbMessages[1].Type = Modify
	result = NewModification(pbMessages, 1, pbOrder)
	// Yields a MoveOrder instead of an UpdateOrder mod
	assert.Equal(t, MoveOrderType, result.Type)
	assert.Nil(t, result.Price)
	assert.Equal(t, int64(150), *result.Quantity) // Exceptionally has a Quantity
	assert.Equal(t, *result.To, *result.From)     // Same price
}

func TestModificationsNilOrder(t *testing.T) {
	// Nil order means the msg is not valid, therefore we drop the modification
	msg := MakeMsg(TypeDelete)
	result := NewModification([]*Message{msg}, 0, nil)
	assert.Nil(t, result)

	msg.Type = Modify
	result = NewModification([]*Message{msg}, 0, nil)
	assert.Nil(t, result)

	msg.Type = Execute
	result = NewModification([]*Message{msg}, 0, nil)
	assert.Nil(t, result)
}
