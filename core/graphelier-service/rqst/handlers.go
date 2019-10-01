package rqst

import (
	"encoding/json"
	"fmt"
	"net/http"

	"graphelier-service/qrs"
)

// Hello : A temporary greeting message at the root route
func Hello(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, from graphelier-service :)")
}

// JSONResponse : A test sending json as a response
func JSONResponse(w http.ResponseWriter, r *http.Request) {
	keyframe := qrs.Keyframe{ID: "abc123"}
	json.NewEncoder(w).Encode(keyframe)
}