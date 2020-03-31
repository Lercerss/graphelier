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
		"/_refresh_cache/",
		hndlrs.CustomHandler{H: hndlrs.RefreshCache},
	},
	Route{
		"Order",
		"GET",
		"/order/{instrument}/{orderID}/{timestamp}",
		hndlrs.CustomHandler{H: hndlrs.FetchOrderInfo},
	},
	Route{
		"TopBook",
		"GET",
		"/topbook/{instrument}/{start_timestamp}/{end_timestamp}/{num_points}",
		hndlrs.CustomHandler{H: hndlrs.FetchTopBook},
	},
	Route{
		"Playback",
		"GET",
		"/playback/{instrument}/{timestamp}/",
		hndlrs.CustomHandler{H: hndlrs.StreamPlayback},
	},
}
