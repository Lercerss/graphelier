package rqst

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"graphelier/core/graphelier-service/qrs"

	"github.com/gorilla/mux"
)

// Hello : A temporary greeting message at the root route
func Hello(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, from graphelier-service :)")
}

// JSONData : Sends a json data response depending on the timestamp requested
func JSONData(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	w.WriteHeader(http.StatusOK)

	timestamp, err := strconv.ParseFloat(params["timestamp"], 64)
	if err != nil {
		log.Fatal(err)
	}

	// When timestamp is not perfectly divisible by 10*10^9, return all previous messages
	// if divisor := 10 * math.Pow10(9); math.Mod(timestamp, divisor) != 0 {
		// TODO: implement messages return
		// timestamp = timestamp + 1 * math.Pow10(9)
		// m["messages"] = qrs.FindMessage(params["instrument"], timestamp)
	// }

	// Always return orderbook
	err = json.NewEncoder(w).Encode(qrs.FindOrderbook(params["instrument"], timestamp))
	if err != nil {
		log.Fatal(err)
	}

}
