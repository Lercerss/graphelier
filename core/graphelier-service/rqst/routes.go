package rqst

import (
	"net/http"
	
	"github.com/gorilla/mux"
)

// Route : a struct representing one route
type Route struct {
	Name string
	Method string
	Pattern string
	HandlerFunc http.HandlerFunc
}

// Routes : An array of Route structs
type Routes []Route

// NewRouter : Creates a new router instance
func NewRouter() *mux.Router {
	router := mux.NewRouter()

	for _, route := range routes {
		router.
		Name(route.Name).
		Methods(route.Method).
		Path(route.Pattern).
		Handler(route.HandlerFunc)
	}

	return router
}

var routes = Routes {
	Route {
		"Root",
		"GET",
		"/",
		Hello,
	},
	Route {
		"JSON",
		"GET",
		"/json/{instrument}&{timestamp}",
		JSONResponse,
	},
}
