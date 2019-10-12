package rqst

import (
	"graphelier/core/graphelier-service/cnxn"
	"net/http"

	"github.com/gorilla/mux"
)

// Route : a struct representing one route
type Route struct {
	Name        string
	Method      string
	Pattern     string
	HandlerFunc ServiceHandler
}

// Routes : An array of Route structs
type Routes []Route

// NewRouter : Creates a new router instance
func NewRouter(db *cnxn.DB) *mux.Router {
	router := mux.NewRouter().Get(http.HandleFunc())

	for _, route := range routes {
		service := ServiceHandler{route.HandlerFunc.Handler, db}
		handler := service.ServeHTTP
		router.
			Name(route.Name).
			Methods(route.Method).
			Path(route.Pattern).
			Handler(handler.(http.HandlerFunc))
	}

	return router
}

var routes = Routes{
	Route{
		"Root",
		"GET",
		"/",
		ServiceHandler{Hello, nil},
	},
	Route{
		"Orderbook",
		"GET",
		"/orderbook/{instrument}/{timestamp}",
		ServiceHandler{JSONData, nil},
	},
}
