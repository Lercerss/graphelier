package test_utils

import (
	"graphelier/core/graphelier-service/mock_db"
	"graphelier/core/graphelier-service/models"
	"testing"

	"github.com/golang/mock/gomock"
)

// Ctrl : gomock global Controller for ease of setup, simply `defer test_utils.Ctrl.Finish()` after calling MockDb
var Ctrl *gomock.Controller

// DefaultMessage : used as template for MakeMsg, do not modify
var DefaultMessage *models.Message = &models.Message{
	OrderID:       uint64(1),
	Type:          models.NewOrder,
	Price:         100.0,
	ShareQuantity: int64(10),
	Timestamp:     uint64(1),
	SodOffset:     uint64(1),
	Direction:     models.Bids,
	Instrument:    "test",
}

// MockDb : Instantiates a MockDatastore and resets the global Controller, should be used in test setup. Make sure to `defer test_utils.Ctrl.Finish()`
func MockDb(t *testing.T) *mock_db.MockDatastore {
	Ctrl = gomock.NewController(t)
	return mock_db.NewMockDatastore(Ctrl)
}

type MessageFactoryArgument func(*models.Message) error

// OrderID : Returns a MessageFactoryArgument that will set the message's OrderID to the given value
func OrderID(id uint64) MessageFactoryArgument {
	return func(msg *models.Message) error {
		msg.OrderID = id
		return nil
	}
}

// Price : Returns a MessageFactoryArgument that will set the message's Price to the given value
func Price(price float64) MessageFactoryArgument {
	return func(msg *models.Message) error {
		msg.Price = price
		return nil
	}
}

// ShareQuantity : Returns a MessageFactoryArgument that will set the message's ShareQuantity to the given value
func ShareQuantity(qty int64) MessageFactoryArgument {
	return func(msg *models.Message) error {
		msg.ShareQuantity = qty
		return nil
	}
}

// Timestamp : Returns a MessageFactoryArgument that will set the message's Timestamp to the given value
func Timestamp(ts uint64) MessageFactoryArgument {
	return func(msg *models.Message) error {
		msg.Timestamp = ts
		return nil
	}
}

// SodOffset : Returns a MessageFactoryArgument that will set the message's SodOffset to the given value
func SodOffset(sod uint64) MessageFactoryArgument {
	return func(msg *models.Message) error {
		msg.SodOffset = sod
		return nil
	}
}

// DirectionAsk : Sets the message's direction to Asks
func DirectionAsk(msg *models.Message) error {
	msg.Direction = models.Asks
	return nil
}

// DirectionBid : Sets the message's direction to Bids
func DirectionBid(msg *models.Message) error {
	msg.Direction = models.Bids
	return nil
}

// TypeNewOrder : Sets the message's type to NewOrder
func TypeNewOrder(msg *models.Message) error {
	msg.Type = models.NewOrder
	return nil
}

// TypeModify : Sets the message's type to Modify
func TypeModify(msg *models.Message) error {
	msg.Type = models.Modify
	return nil
}

// TypeDelete : Sets the message's type to Delete
func TypeDelete(msg *models.Message) error {
	msg.Type = models.Delete
	return nil
}

// TypeExecute : Sets the message's type to Execute
func TypeExecute(msg *models.Message) error {
	msg.Type = models.Execute
	return nil
}

// TypeIgnore : Sets the message's type to Ignore
func TypeIgnore(msg *models.Message) error {
	msg.Type = models.Ignore
	return nil
}

// MakeMsg : Factory method for models.Messages, default values found below. Use the factory arguments to modify attributes of the generated message
func MakeMsg(args ...MessageFactoryArgument) *models.Message {
	msg := *DefaultMessage // Copy defaults
	for _, arg := range args {
		if err := arg(&msg); err != nil {
			return nil
		}
	}
	return &msg
}

// MakeLevel : Helper function to ease creation of empty Levels
func MakeLevel(price float64, orders ...*models.Order) *models.Level {
	if orders == nil {
		orders = make([]*models.Order, 0)
	}
	return &models.Level{Price: price, Orders: orders}
}
