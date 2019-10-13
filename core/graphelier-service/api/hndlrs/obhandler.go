package hndlrs

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"graphelier/core/graphelier-service/models"

	"github.com/gorilla/mux"
)

// JSONOrderbook : Sends an orderbook as json
func JSONOrderbook(env *Env, w http.ResponseWriter, r *http.Request) error {
	params := mux.Vars(r)
	w.WriteHeader(http.StatusOK)

	instrument := params["instrument"]
	timestamp := params["timestamp"]

	// Convert string to uint64
	intTimestamp, err := strconv.ParseUint(timestamp, 10, 64)
	if err != nil {
		log.Fatal(err)
	}
	var orderbook *models.Orderbook

	if divisor := uint64(10000000000); intTimestamp%divisor != 0 {
		latestFullSnapshot := intTimestamp / divisor * divisor
		orderbook = env.Connector.GetOrderbook(instrument, intTimestamp)
		messages := env.Connector.GetMessages(instrument, intTimestamp, latestFullSnapshot)
		orderbook.ApplyMessagesToOrderbook(messages)
	} else {
		orderbook = env.Connector.GetOrderbook(instrument, intTimestamp)
	}

	err = json.NewEncoder(w).Encode(orderbook)
	if err != nil {
		log.Fatal(err)
	}

	return nil
}
