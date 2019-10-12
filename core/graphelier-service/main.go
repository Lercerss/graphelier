package main

import (
	"log"
	"net/http"

	"graphelier/core/graphelier-service/cnxn"
	"graphelier/core/graphelier-service/rqst"
)

// Service : A struct representing the appliations components
// type Service struct {
// 	db cnxn.Queries
// }

func main() {
	// db := cnxn.GetInstance()
	// db.Connect()

	db, err := cnxn.NewConnection()
	if err != nil {
		log.Fatal(err)
	}
	// defer db.Close()

	router := rqst.NewRouter(db)

	// service := &Service{db}

	log.Fatal(http.ListenAndServe(":5050", handlers.CORS(handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"}), handlers.AllowedMethods([]string{"GET", "POST", "PUT", "HEAD", "OPTIONS"}), handlers.AllowedOrigins([]string{"*"}))(router)))
}
