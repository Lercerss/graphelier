package rqst

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"graphelier-service/qrs"
)

// Hello : A temporary greeting message at the root route
func Hello(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, from graphelier-service :)")
}

// JSONResponse : A test sending json as a response
func JSONResponse(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	w.WriteHeader(http.StatusOK)

	timestamp, err := strconv.ParseUint(params["timestamp"], 10, 64)
	if err != nil {
		log.Fatal(err)
	}


	keyframe := qrs.FindKeyframe(params["instrument"], timestamp)
	json.NewEncoder(w).Encode(keyframe)
}