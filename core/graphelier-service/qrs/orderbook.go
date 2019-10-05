package qrs

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"graphelier-service/cnxn"
)

// Orderbook : A struct that represents the entire orderbook
type Orderbook struct {
	Instrument string `json:"instrument"`
	Bids []struct {
		Price float64 `json:"price"`
		Orders []struct {
			ID uint64 `json:"id" bson:"id"`
			Quantity uint64 `json:"quantity"`
		} `json:"orders"`
	} `json:"bids"`
	Asks []struct {
		Price float64 `json:"price"`
		Orders []struct {
			ID uint64 `json:"id" bson:"id"`
			Quantity uint64 `json:"quantity"`
		} `json:"orders"`
	} `json:"asks"`
	Timestamp float64 `json:"timestamp"`
}

// FindOrderbook : Finds the Orderbook of an instrument based on the timestamp requested
func FindOrderbook(instrument string, timestamp float64) (*Orderbook) { 
	collection := cnxn.GetInstance().C.Database("graphelier-db").Collection("orderbooks")
	filter := bson.D{{"instrument", instrument}, {"timestamp", timestamp}}

	var result Orderbook
	err := collection.FindOne(context.TODO(), filter).Decode(&result)
	if err != nil {
		log.Fatal(err)
	}
	
	return &result
}
