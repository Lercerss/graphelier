package main

import (
	"log"
	"net/http"

	"graphelier/core/graphelier-service/cnxn"
	"graphelier/core/graphelier-service/rqst"

	"github.com/gorilla/handlers"
)

func main() {
	db := cnxn.GetInstance()
	db.Connect()

	r := rqst.NewRouter()
	log.Fatal(http.ListenAndServe(":5050", handlers.CORS(handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"}), handlers.AllowedMethods([]string{"GET", "POST", "PUT", "HEAD", "OPTIONS"}), handlers.AllowedOrigins([]string{"*"}))(r)))
}
