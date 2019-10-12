package rqst

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"graphelier/core/graphelier-service/cnxn"

	"github.com/gorilla/mux"
)

// ServiceHandler : A struct that wraps the handlers
type ServiceHandler struct {
	Handler func(db *cnxn.DB, w http.ResponseWriter, r *http.Request)
	DB      *cnxn.DB
}

func (sh *ServiceHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	sh.Handler(sh.DB, w, r)
}

// Hello : A temporary greeting message at the root route
func Hello(db *cnxn.DB, w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, from graphelier-service :)")
}

// JSONData : Sends a json data response depending on the timestamp requested
func JSONData(db *cnxn.DB, w http.ResponseWriter, r *http.Request) {
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
	json.NewEncoder(w).Encode(db.FindOrderbook(params["instrument"], timestamp))

	// Close db connection

}
