package api

import (
	"graphelier/core/graphelier-service/api/hndlrs"

	"github.com/gorilla/mux"
)

// Route : a struct representing one route
type Route struct {
	Name          string
	Method        string
	Pattern       string
	CustomHandler hndlrs.CustomHandler
}

// Routes : An array of Route structs
type Routes []Route

// NewRouter : Creates a new router instance
func NewRouter(env *hndlrs.Env) *mux.Router {
	router := mux.NewRouter()

	for _, route := range routes {
		route.CustomHandler.E = env
		router.
			Name(route.Name).
			Methods(route.Method).
			Path(route.Pattern).
			Handler(route.CustomHandler)
	}

	return router
}

var routes = Routes{
	Route{
		"Orderbook",
		"GET",
		"/orderbook/{instrument}/{timestamp}",
		hndlrs.CustomHandler{H: hndlrs.FetchOrderbook},
	},
	Route{
		"Deltabook",
		"GET",
		"/delta/{instrument}/{sod_offset}/{num_messages}",
		hndlrs.CustomHandler{H: hndlrs.FetchOrderbookDelta},
	},
	Route{
		"Message",
		"GET",
		"/messages/{instrument}/{sodOffset}",
		hndlrs.CustomHandler{H: hndlrs.FetchMessages},
	},
	Route{
		"Instruments",
		"GET",
		"/instruments/",
		hndlrs.CustomHandler{H: hndlrs.FetchInstruments},
	},
	Route{
		"RefreshCache",
		"GET",
		"/_refresh/",
		hndlrs.CustomHandler{H: hndlrs.RefreshCache},
	},
}
