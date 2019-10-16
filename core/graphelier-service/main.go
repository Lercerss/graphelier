package main

import (
	"log"
	"net/http"

	"graphelier/core/graphelier-service/api"
	"graphelier/core/graphelier-service/api/hndlrs"
	"graphelier/core/graphelier-service/db"

	"github.com/gorilla/handlers"
)

func main() {
	db, err := db.NewConnection()
	if err != nil {
		log.Fatal(err)
	}

	env := &hndlrs.Env{Connector: db}
	router := api.NewRouter(env)

	log.Fatal(http.ListenAndServe(":5050", handlers.CORS(handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"}), handlers.AllowedMethods([]string{"GET", "POST", "PUT", "HEAD", "OPTIONS"}), handlers.AllowedOrigins([]string{"*"}))(router)))
}
