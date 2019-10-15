package hndlrs

import (
	"context"
	"encoding/json"
	"log"
	"math"
	"net/http"
	"strconv"

	"graphelier/core/graphelier-service/api/models"
	"graphelier/core/graphelier-service/config"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
)

// FindOrderbook : Finds the Orderbook of an instrument based on the timestamp requested in the db
func FindOrderbook(env *config.Env, instrument string, timestamp float64) (result *models.Orderbook) {
	collection := env.DB.Database("graphelier-db").Collection("orderbooks")
	filter := bson.D{{Key: "instrument", Value: instrument}, {Key: "timestamp", Value: timestamp}}

	err := collection.FindOne(context.TODO(), filter).Decode(&result)
	if err != nil {
		log.Fatal(err)
	}

	return result
}

// JSONOrderbook : Sends an orderbook as json
func JSONOrderbook(env *config.Env, w http.ResponseWriter, r *http.Request) error {
	params := mux.Vars(r)
	w.WriteHeader(http.StatusOK)

	timestamp, err := strconv.ParseFloat(params["timestamp"], 64)
	if err != nil {
		log.Fatal(err)
	}

	// When timestamp is not perfectly divisible by 10*10^9, return all previous messages
	if divisor := 10 * math.Pow10(9); math.Mod(timestamp, divisor) != 0 {
		// TODO: implement messages return
		// timestamp = timestamp + 1 * math.Pow10(9)
		// m["messages"] = qrs.FindMessage(params["instrument"], timestamp)
	}

	// Always return orderbook
	json.NewEncoder(w).Encode(FindOrderbook(env, params["instrument"], timestamp))

	return nil
}
