package hndlrs

import (
	"encoding/json"
	"net/http"
	"strconv"

	"graphelier/core/graphelier-service/models"

	"github.com/gorilla/mux"
)

// JSONOrderbook : Sends an orderbook as json
func JSONOrderbook(env *Env, w http.ResponseWriter, r *http.Request) error {
	params := mux.Vars(r)

	instrument := params["instrument"]
	timestamp := params["timestamp"]

	// Convert string to uint64
	intTimestamp, err := strconv.ParseUint(timestamp, 10, 64)
	if err != nil {
		return err
	}
	var orderbook *models.Orderbook
	var messages []*models.Message

	if divisor := uint64(10000000000); intTimestamp%divisor != 0 {
		latestFullSnapshot := intTimestamp / divisor * divisor
		orderbook, err = env.Connector.GetOrderbook(instrument, intTimestamp)
		if err != nil {
			return err
		}
		messages, err = env.Connector.GetMessages(instrument, intTimestamp, latestFullSnapshot)
		if err != nil {
			return err
		}
		orderbook.ApplyMessagesToOrderbook(messages)
	} else {
		orderbook, err = env.Connector.GetOrderbook(instrument, intTimestamp)
		if err != nil {
			return err
		}
	}

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(orderbook)
	if err != nil {
		return err
	}


	return nil
}
