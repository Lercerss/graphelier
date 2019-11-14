package hndlrs

import (
	"encoding/json"
	"net/http"
)

// FetchInstruments : Retrieve available instruments
func FetchInstruments(env *Env, w http.ResponseWriter, r *http.Request) error {
	instruments, err := env.Connector.GetInstruments()
	if err != nil {
		return StatusError{500, err}
	}

	err = json.NewEncoder(w).Encode(instruments)
	if err != nil {
		return StatusError{500, err}
	}

	return nil
}
