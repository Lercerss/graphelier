package qrs

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"graphelier-service/cnxn"
)

// Keyframe : A struct to hold keyframe data
type Keyframe struct {
	ID string `json:"id"`
	Instrument string `json:"instrument"`
	Bids [] struct { 
		ID string `json:"id"`
		Qty uint64 `json:"qty"`
		Price float64 `json:"price"`
	} `json:"bids"`
	Asks [] struct {
		ID string `json:"id"`
		Qty uint64`json:"qty"`
		Price float64 `json:"price"`
	} `json:"asks"`
	Timestamp uint64 `json:"timestamp"`
}

// FindKeyframe : Finds the keyframe of an instrument based on the timeframe requested
func FindKeyframe(instrument string, timestamp uint64) (k *Keyframe) { 
	collection := cnxn.GetInstance().C.Database("graphelier-db").Collection("keyframes")

	filter := bson.D{{"instrument", instrument}, {"timestamp", timestamp}}

	var result Keyframe
	err := collection.FindOne(context.TODO(), filter).Decode(&result)

	if err != nil {
		log.Fatal(err)
	}
	
	return &result
}
