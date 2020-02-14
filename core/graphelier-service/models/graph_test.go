package models_test

import (
	. "graphelier/core/graphelier-service/models"
	. "graphelier/core/graphelier-service/utils/test_utils"
	"testing"

	"github.com/stretchr/testify/assert"
)

var messages99 []*Message
var messages100 []*Message
var messages101 []*Message

func setup() {
	orderbook = &Orderbook{}
	messages99 = []*Message{
		MakeMsg(DirectionAsk, OrderID(10), Price(106.0), Timestamp(99), SodOffset(1)),
		MakeMsg(DirectionAsk, OrderID(20), Price(200.0), Timestamp(99), SodOffset(2)),
		MakeMsg(DirectionBid, OrderID(30), Price(101.0), Timestamp(99), SodOffset(3)),
		MakeMsg(DirectionBid, OrderID(40), Price(201.0), Timestamp(99), SodOffset(4)),
	}
	messages100 = []*Message{
		MakeMsg(DirectionAsk, OrderID(50), Price(108.0), Timestamp(100), SodOffset(5)),
		MakeMsg(DirectionAsk, OrderID(60), Price(200.0), Timestamp(100), SodOffset(6)),
		MakeMsg(DirectionBid, OrderID(70), Price(101.0), Timestamp(100), SodOffset(7)),
		MakeMsg(DirectionBid, OrderID(80), Price(201.0), Timestamp(100), SodOffset(8)),
	}
	messages101 = []*Message{
		MakeMsg(DirectionAsk, OrderID(90), Price(102.0), Timestamp(101), SodOffset(9)),
		MakeMsg(DirectionAsk, OrderID(100), Price(201.0), Timestamp(101), SodOffset(10)),
		MakeMsg(DirectionBid, OrderID(110), Price(101.0), Timestamp(101), SodOffset(11)),
		MakeMsg(DirectionBid, OrderID(120), Price(202.0), Timestamp(101), SodOffset(12)),
	}
}

func TestCreatePoint(t *testing.T) {
	setup()
	orderbook.ApplyMessagesToOrderbook(messages99)
	point := CreatePoint(orderbook, uint64(99))
	assert.Equal(t, uint64(99), point.Timestamp)
	assert.Equal(t, 106.0, point.BestAsk)
	assert.Equal(t, 201.0, point.BestBid)

	orderbook.ApplyMessagesToOrderbook(messages100)
	point = CreatePoint(orderbook, uint64(100))
	assert.Equal(t, uint64(100), point.Timestamp)
	assert.Equal(t, 106.0, point.BestAsk)
	assert.Equal(t, 201.0, point.BestBid)

	orderbook.ApplyMessagesToOrderbook(messages101)
	point = CreatePoint(orderbook, uint64(101))
	assert.Equal(t, uint64(101), point.Timestamp)
	assert.Equal(t, 102.0, point.BestAsk)
	assert.Equal(t, 202.0, point.BestBid)
}

func TestCreateTopBook(t *testing.T) {
	setup()
	orderbook.ApplyMessagesToOrderbook(messages99)
	point1 := CreatePoint(orderbook, uint64(99))
	topbook := []*Point{}
	topbook, _ = point1.CreateTopBook(topbook, uint64(0), messages99[0].Timestamp)
	assert.Equal(t, 1, len(topbook))
	assert.Equal(t, uint64(99), topbook[0].Timestamp)
	assert.Equal(t, 106.0, topbook[0].BestAsk)
	assert.Equal(t, 201.0, topbook[0].BestBid)

	orderbook.ApplyMessagesToOrderbook(messages100)
	point2 := CreatePoint(orderbook, uint64(100))
	topbook, _ = point2.CreateTopBook(topbook, uint64(1), messages100[0].Timestamp)
	assert.Equal(t, 2, len(topbook))
	assert.Equal(t, uint64(99), topbook[0].Timestamp)
	assert.Equal(t, 106.0, topbook[0].BestAsk)
	assert.Equal(t, 201.0, topbook[0].BestBid)
	assert.Equal(t, uint64(100), topbook[1].Timestamp)
	assert.Equal(t, 106.0, topbook[1].BestAsk)
	assert.Equal(t, 201.0, topbook[1].BestBid)

	orderbook.ApplyMessagesToOrderbook(messages101)
	point3 := CreatePoint(orderbook, uint64(101))
	topbook, _ = point3.CreateTopBook(topbook, uint64(2), messages101[0].Timestamp)
	assert.Equal(t, 3, len(topbook))
	assert.Equal(t, uint64(99), topbook[0].Timestamp)
	assert.Equal(t, 106.0, topbook[0].BestAsk)
	assert.Equal(t, 201.0, topbook[0].BestBid)
	assert.Equal(t, uint64(100), topbook[1].Timestamp)
	assert.Equal(t, 106.0, topbook[1].BestAsk)
	assert.Equal(t, 201.0, topbook[1].BestBid)
	assert.Equal(t, uint64(101), topbook[2].Timestamp)
	assert.Equal(t, 102.0, topbook[2].BestAsk)
	assert.Equal(t, 202.0, topbook[2].BestBid)
}
