package hndlrs

import (
	"encoding/json"
	"net/http"
	"strconv"

	"graphelier/core/graphelier-service/models"
	"graphelier/core/graphelier-service/utils"

	"github.com/gorilla/mux"
)

// FetchOrderbook : Sends an orderbook state based on instrument and timestamp
func FetchOrderbook(env *Env, w http.ResponseWriter, r *http.Request) error {
	params := mux.Vars(r)

	instrument := params["instrument"]
	t := params["timestamp"]

	// Convert string to uint64
	timestamp, err := strconv.ParseUint(t, 10, 64)
	if err != nil {
		return StatusError{400, err}
	}

	orderbook, err := env.Connector.GetOrderbook(instrument, timestamp)
	if err != nil {
		return StatusError{500, err}
	}
	messages, err := env.Connector.GetMessagesByTimestamp(instrument, timestamp)
	if err != nil {
		return StatusError{500, err}
	}
	orderbook.ApplyMessagesToOrderbook(messages)

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(orderbook)
	if err != nil {
		return StatusError{500, err}
	}

	w.WriteHeader(http.StatusOK)

	return nil
}

// FetchOrderbookDelta : Sends an orderbook state based on the instrument, sod offset, and message offset
func FetchOrderbookDelta(env *Env, w http.ResponseWriter, r *http.Request) (err error) {
	params := mux.Vars(r)

	instrument := params["instrument"]
	so := params["sod_offset"]
	nm := params["num_messages"]

	// Convert strings to int64
	sodOffset, err := strconv.ParseInt(so, 10, 64)
	if err != nil {
		return StatusError{400, err}
	}
	numMessages, err := strconv.ParseInt(nm, 10, 64)
	if err != nil {
		return StatusError{400, err}
	}

	sodMessage, err := env.Connector.GetSingleMessage(instrument, sodOffset)
	if err != nil {
		return StatusError{500, err}
	}
	orderbook, err := env.Connector.GetOrderbook(instrument, sodMessage.Timestamp)
	if err != nil {
		return StatusError{500, err}
	}
	totalOffset := int64(int64(sodMessage.SodOffset-orderbook.LastSodOffset) + numMessages)

	// get previous book for high number of backward messages
	for totalOffset < 0 {
		prevSnapTime := int64(orderbook.Timestamp - 10000000000)
		if prevSnapTime < 0 {
			return StatusError{400, err}
		}
		orderbook, err = env.Connector.GetOrderbook(instrument, uint64(prevSnapTime))
		if err != nil {
			return StatusError{500, err}
		}
		totalOffset = int64(int64(sodMessage.SodOffset-orderbook.LastSodOffset) + numMessages)
	}
	nMessages := int64(int64(sodMessage.SodOffset-orderbook.LastSodOffset) + utils.Abs(numMessages))
	paginator := &models.Paginator{NMessages: nMessages, SodOffset: int64(orderbook.LastSodOffset)}
	allMessages, err := env.Connector.GetMessagesWithPagination(instrument, paginator)
	if err != nil {
		return StatusError{500, err}
	}

	var preMessagesSize int64
	if numMessages < 0 {
		// messages going backward
		preMessagesSize = int64(sodMessage.SodOffset-orderbook.LastSodOffset) + numMessages
	} else {
		// messages going forward
		preMessagesSize = int64(sodMessage.SodOffset - orderbook.LastSodOffset)
	}
	preMessages := allMessages[:preMessagesSize]
	postMessages := allMessages[preMessagesSize:]
	orderbook.ApplyMessagesToOrderbook(preMessages)

	deltabook := orderbook.ApplyMessagesToDeltabook(postMessages, numMessages)

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(deltabook)
	if err != nil {
		return StatusError{500, err}
	}

	return nil
}
