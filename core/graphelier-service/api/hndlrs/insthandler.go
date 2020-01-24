package hndlrs

import (
	"encoding/json"
	"net/http"

	log "github.com/sirupsen/logrus"
)

// FetchInstruments : Retrieve available instruments
func FetchInstruments(env *Env, w http.ResponseWriter, r *http.Request) error {
	instruments, err := env.Datastore.GetInstruments()
	if err != nil {
		return StatusError{500, err}
	}
	log.Debugf("Found %d instruments\n", len(instruments))

	err = json.NewEncoder(w).Encode(instruments)
	if err != nil {
		return StatusError{500, err}
	}

	return nil
}
