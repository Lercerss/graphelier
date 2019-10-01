package main

import (
	"log"
	"net/http"

	"graphelier-service/rqst"
	"graphelier-service/cnxn"
)

func main() {
	db := cnxn.GetInstance()
	db.Connect()
	
	r := rqst.NewRouter()
	log.Fatal(http.ListenAndServe(":5050", r))
}
