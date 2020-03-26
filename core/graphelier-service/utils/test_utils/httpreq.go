package test_utils

import (
	"encoding/json"
	handlers "graphelier/core/graphelier-service/api/hndlrs"
	"graphelier/core/graphelier-service/db"
	"io/ioutil"
	"net/http"
	"net/http/httptest"

	"github.com/gorilla/mux"
)

// MakeRequest : Sends a test request to the given handler
func MakeRequest(
	method func(e *handlers.Env, w http.ResponseWriter, r *http.Request) error,
	connector db.Datastore,
	verb string,
	route string,
	params map[string]string,
	result interface{},
) error {
	req := httptest.NewRequest(verb, route, nil)
	writer := httptest.NewRecorder()
	if params != nil {
		req = mux.SetURLVars(req, params)
	}
	err := method(&handlers.Env{Datastore: connector}, writer, req)
	if err != nil {
		return err
	}
	resp := writer.Result()
	body, _ := ioutil.ReadAll(resp.Body)
	return json.Unmarshal(body, result)
}
