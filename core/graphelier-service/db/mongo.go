package db

import (
	"context"
	"fmt"
	"log"

	"graphelier/core/graphelier-service/api/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Connector : A struct that represents the database
type Connector struct {
	*mongo.Client
}

// NewConnection : The database connection
func NewConnection() (*Connector, error) {
	clientOptions := options.Client().ApplyURI("mongodb://mongo:27017/graphelier-db")
	client, err := mongo.Connect(context.TODO(), clientOptions)

	if err != nil {
		log.Fatal(err)
	}

	if err = client.Ping(context.TODO(), nil); err != nil {
		log.Fatal(err)
	}
	fmt.Println("Connected to MongoDB :)")

	return &Connector{client}, nil
}

// FindOrderbook : Finds the Orderbook of an instrument based on the timestamp requested in the db
func (c *Connector) FindOrderbook(instrument string, timestamp float64) (result *models.Orderbook) {
	collection := c.Database("graphelier-db").Collection("orderbooks")
	filter := bson.D{{Key: "instrument", Value: instrument}, {Key: "timestamp", Value: timestamp}}

	err := collection.FindOne(context.TODO(), filter).Decode(&result)
	if err != nil {
		log.Fatal(err)
	}

	return result
}
