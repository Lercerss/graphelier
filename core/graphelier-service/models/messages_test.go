package models_test

import (
	. "graphelier/core/graphelier-service/models"
	. "graphelier/core/graphelier-service/utils/test_utils"
	"testing"

	"github.com/stretchr/testify/assert"
)

var messagesFromTimestamp = []*Message{
	MakeMsg(DirectionAsk, OrderID(12), Price(100.0), Timestamp(99), SodOffset(1)),
	MakeMsg(DirectionAsk, OrderID(17), Price(200.0), Timestamp(100), SodOffset(4)),
	MakeMsg(DirectionBid, OrderID(13), Price(100.0), Timestamp(99), SodOffset(2)),
	MakeMsg(DirectionBid, OrderID(20), Price(200.0), Timestamp(100), SodOffset(5)),
}

// TestGetMessagesForTimestamp : Checks if the appropriate list of messages are found given a timestamp
func TestGetMessagesForTimestamp(t *testing.T) {
	mArray := GetMessagesForTimestamp(messagesFromTimestamp, 99)

	assert.Equal(t, 2, len(mArray))
	assert.Equal(t, uint64(99), mArray[0].Timestamp)
	assert.Equal(t, uint64(99), mArray[1].Timestamp)
	assert.Equal(t, uint64(1), mArray[0].SodOffset)
	assert.Equal(t, uint64(2), mArray[1].SodOffset)
}

// TestNoMessagesFound() : Checks to see that no messages are appended when there's no matching timestamp
func TestNoMessagesFound(t *testing.T) {
	mArray := GetMessagesForTimestamp(messagesFromTimestamp, 101)

	assert.Equal(t, 0, len(mArray))
}