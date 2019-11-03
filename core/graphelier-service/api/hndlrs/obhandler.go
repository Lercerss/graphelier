package hndlrs

import (
	"encoding/json"
	"net/http"
	"strconv"

	"graphelier/core/graphelier-service/models"

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
	messages, err := env.Connector.GetMessages(instrument, timestamp)
	if err != nil {
		return StatusError{500, err}
	}
	orderbook.ApplyMessages(messages)

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

	// Convert strings to uint64
	sodOffset, err := strconv.ParseInt(so, 10, 64)
	if err != nil {
		return StatusError{400, err}
	}
	numMessages, err := strconv.ParseInt(nm, 10, 64)
	if err != nil {
		return StatusError{400, err}
	}

	totalOffset := int64(sodOffset + numMessages)
	if totalOffset < 0 {
		totalOffset = 0
	}

	message, err := env.Connector.GetSingleMessage(instrument, totalOffset)
	if err != nil {
		return StatusError{500, err}
	}
	if message.OrderID == 0 || models.MessageType(message.MessageType) == models.Ignore {
		w.WriteHeader(http.StatusOK)
		return
	}
	orderbook, err := env.Connector.GetOrderbook(instrument, message.Timestamp)
	if err != nil {
		return StatusError{500, err}
	}
	messages, err := env.Connector.GetMessages(instrument, message.Timestamp)
	if err != nil {
		return StatusError{500, err}
	}
	orderbook.ApplyMessages(messages)
	deltabook := orderbook.BuildDeltabook(message)

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(deltabook)
	if err != nil {
		return StatusError{500, err}
	}

	return nil
}
