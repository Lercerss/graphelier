package main

import (
	"net/http"

	"graphelier/core/graphelier-service/api"
	"graphelier/core/graphelier-service/api/hndlrs"
	"graphelier/core/graphelier-service/db"

	"github.com/gorilla/handlers"
	log "github.com/sirupsen/logrus"
	easy "github.com/t-tomalak/logrus-easy-formatter"
)

func main() {
	log.SetFormatter(&easy.Formatter{
		LogFormat: "[%lvl%]: %time% - %msg%",
	})
	log.SetLevel(log.TraceLevel)

	db, err := db.NewConnection()
	if err != nil {
		log.Fatalf("Could not establish connection to MongoDB: %v\n", err)
	}

	env := &hndlrs.Env{Connector: db}
	router := api.NewRouter(env)

	log.Fatalln(http.ListenAndServe(":5050", handlers.CORS(handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"}), handlers.AllowedMethods([]string{"GET", "POST", "PUT", "HEAD", "OPTIONS"}), handlers.AllowedOrigins([]string{"*"}))(router)))
}
