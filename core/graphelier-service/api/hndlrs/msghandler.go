package hndlrs

import (
	"encoding/json"
	"net/http"
	"strconv"

	"graphelier/core/graphelier-service/models"

	"github.com/gorilla/mux"
	log "github.com/sirupsen/logrus"
)

// FetchMessages returns messages given an instrument and sod_offset with support for
// pagination
func FetchMessages(env *Env, w http.ResponseWriter, r *http.Request) error {
	nMessages := r.URL.Query().Get("nMessages")

	params := mux.Vars(r)
	instrument := params["instrument"]
	sodOffset := params["sodOffset"]

	intNMessages, err := strconv.ParseInt(nMessages, 10, 8)
	if err != nil {
		intNMessages = 20
	}

	intSodOffset, err := strconv.ParseInt(sodOffset, 10, 64)
	if err != nil {
		return StatusError{400, err}
	}
	paginator := models.Paginator{NMessages: intNMessages, SodOffset: intSodOffset}
	messages, err := env.Datastore.GetMessagesWithPagination(instrument, &paginator)
	if err != nil {
		return StatusError{500, err}
	}
	log.Debugf("Found %d messages\n", len(messages))

	responsePaginator := models.Paginator{NMessages: intNMessages, SodOffset: paginator.SodOffset + intNMessages}
	messagePage := models.MessagePage{PageInfo: responsePaginator, Messages: messages}

	if intNMessages < 0 {
		reverseMessageOrdering(&messagePage)
	}
	err = json.NewEncoder(w).Encode(messagePage)
	if err != nil {
		return StatusError{500, err}
	}
	return nil
}

func reverseMessageOrdering(messagePage *models.MessagePage) {
	for i, j := 0, len(messagePage.Messages)-1; i < j; i, j = i+1, j-1 {
		messagePage.Messages[i], messagePage.Messages[j] = messagePage.Messages[j], messagePage.Messages[i]
	}
}
