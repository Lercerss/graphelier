package hndlrs

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// JSONOrderbook : Sends an orderbook as json
func JSONOrderbook(env *Env, w http.ResponseWriter, r *http.Request) error {
	params := mux.Vars(r)
	w.WriteHeader(http.StatusOK)

	timestamp, err := strconv.ParseFloat(params["timestamp"], 64)
	if err != nil {
		log.Fatal(err)
	}

	// TODO: implement messages return

	// When timestamp is not perfectly divisible by 10*10^9, return all previous messages
	// if divisor := 10 * math.Pow10(9); math.Mod(timestamp, divisor) != 0 {
	// timestamp = timestamp + 1 * math.Pow10(9)
	// m["messages"] = qrs.FindMessage(params["instrument"], timestamp)
	// }

	// Always return orderbook
	err = json.NewEncoder(w).Encode(env.Connector.FindOrderbook(params["instrument"], timestamp))
	if err != nil {
		log.Fatal(err)
	}

	return nil
}
