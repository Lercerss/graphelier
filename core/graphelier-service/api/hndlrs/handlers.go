package hndlrs

import (
	"net/http"

	log "github.com/sirupsen/logrus"

	"graphelier/core/graphelier-service/db"
	"graphelier/core/graphelier-service/utils"
)

// Error : An interface that represents a handler error
type Error interface {
	error
	Status() int
}

// StatusError : A struct that indicates status code and error
type StatusError struct {
	Code int
	Err  error
}

// Error : A function that allows StatusError to integrate with the error interface
func (se StatusError) Error() string {
	return se.Err.Error()
}

// Status : A function that return the status code
func (se StatusError) Status() int {
	return se.Code
}

type ParamError struct {
	Value string
}

func (p ParamError) Error() string {
	return p.Value
}

// Env : A struct that represents the database configuration
type Env struct {
	Datastore db.Datastore
}

// CustomHandler : A struct that links Env with a function matching http.HandlerFunc
type CustomHandler struct {
	E *Env
	H func(e *Env, w http.ResponseWriter, r *http.Request) error
}

// ServeHTTP : A function that links CustomHandler with http.Handler
func (h CustomHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	defer utils.Timer(r.URL.String())()

	err := h.H(h.E, w, r)

	if err != nil {
		switch e := err.(type) {
		case Error:
			log.Errorf("HTTP %d - %s\n", e.Status(), e)
			http.Error(w, e.Error(), e.Status())
		default:
			log.Errorf("Error: %s\n", err)
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		}
	}
}
