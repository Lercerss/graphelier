package hndlrs

import (
	"encoding/json"
	"errors"
	"graphelier/core/graphelier-service/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

// FetchOrderInfo returns information about an order using its ID and timestamp
func FetchOrderInfo(env *Env, w http.ResponseWriter, r *http.Request) error {
	params := mux.Vars(r)
	instrument := params["instrument"]
	timestamp := params["timestamp"]
	orderID := params["orderID"]

	intTimestamp, err := strconv.ParseUint(timestamp, 10, 64)
	if err != nil {
		return StatusError{400, err}
	}
	intOrderID, err := strconv.ParseInt(orderID, 10, 64)
	if err != nil {
		return StatusError{400, err}
	}
	SODTimestamp := getClosestSODTimestamp(intTimestamp)
	EODTimestamp := getClosestEODTimestamp(intTimestamp)
	messages, err := env.Connector.GetSingleOrderMessages(instrument, SODTimestamp, EODTimestamp, intOrderID)
	if err != nil {
		return StatusError{500, err}
	}
	if len(messages) == 0 {
		return StatusError{404, errors.New("Order was not found")}
	}
	orderInfoBuilder := &models.OrderInfoBuilder{}
	orderInfoBuilder.
		WithID(intOrderID).
		WithInstrument(instrument).
		WithMessages(&messages).
		WithTimestamp(intTimestamp)
	orderInfo := orderInfoBuilder.Build()
	err = json.NewEncoder(w).Encode(orderInfo)
	if err != nil {
		return StatusError{500, err}
	}
	return nil
}

// getClosestSODTimestamp returns the timestamp of the closest start of day
func getClosestSODTimestamp(timestamp uint64) (SODTimestamp int64) {
	timeObject := time.Unix(0, int64(timestamp))
	closestSOD := timeObject.Truncate(24 * time.Hour) //Rounds off to the closest day
	return closestSOD.UnixNano()
}

// getClosestEODTimestamp returns the timestamp of the closest end of day
func getClosestEODTimestamp(timestamp uint64) (SODTimestamp int64) {
	closestSOD := getClosestSODTimestamp(timestamp)
	closestEOD := closestSOD + 24*int64(time.Hour) // Adds a day
	return closestEOD
}
