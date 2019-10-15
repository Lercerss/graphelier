package hndlrs

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"graphelier/core/graphelier-service/config"
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

// CustomHandler : A struct that links Env with a function matching http.HandlerFunc
type CustomHandler struct {
	E *config.Env
	H func(e *config.Env, w http.ResponseWriter, r *http.Request) error
}

// ServeHTTP : A function that links CustomHandler with http.Handler
func (h CustomHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	err := h.H(h.E, w, r)
	if err != nil {
		switch e := err.(type) {
		case Error:
			log.Printf("HTTP %d - %s", e.Status(), e)
			http.Error(w, e.Error(), e.Status())
		default:
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		}
		log.Fatal(err)
	}
}

// Hello : A temporary greeting message at the root route
func Hello(env *config.Env, w http.ResponseWriter, r *http.Request) error {
	fmt.Fprintf(w, "Hello, from graphelier-service :)")
	err := env.DB.Disconnect(context.TODO())
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Connection to MongoDB closed :)")

	return nil
}
