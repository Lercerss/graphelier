package hndlrs

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// FetchTopBook : Sends a list of timestamps with the best bid and ask
func FetchTopBook(env *Env, w http.ResponseWriter, r *http.Request) (err error) {
	params := mux.Vars(r)

	instrument := params["instrument"]
	sTime := params["start_timestamp"]
	eTime := params["end_timestamp"]
	nPoints := params["num_points"]

	startTime, err := strconv.ParseUint(sTime, 10, 64)
	if err != nil {
		return StatusError{400, err}
	}
	endTime, err := strconv.ParseUint(eTime, 10, 64)
	if err != nil {
		return StatusError{400, err}
	}
	numPoints, err := strconv.ParseInt(nPoints, 10, 64)
	if err != nil {
		return StatusError{400, err}
	}

	// TODO: Handle small interval case
	points, err := env.Datastore.GetTopOfBookByInterval(instrument, startTime, endTime, numPoints)
	if err != nil {
		return StatusError{400, err}
	}

	err = json.NewEncoder(w).Encode(points)
	if err != nil {
		return StatusError{500, err}
	}

	return nil
}
