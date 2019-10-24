package db

import (
	"context"
	"log"

	"graphelier/core/graphelier-service/models"

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
	log.Println("Connected to MongoDB :)")

	return &Connector{client}, nil
}

// GetOrderbook : Finds the Orderbook of an instrument based on the timestamp requested in the db
func (c *Connector) GetOrderbook(instrument string, timestamp uint64) (result *models.Orderbook) {
	collection := c.Database("graphelier-db").Collection("orderbooks")
	filter := bson.D{
		{Key: "instrument", Value: instrument},
		{Key: "timestamp", Value: bson.D{
			{Key: "$lte", Value: timestamp},
		}},
	}
	option := options.FindOne()
	option.SetSort(bson.D{{Key: "timestamp", Value: -1}})

	err := collection.FindOne(context.TODO(), filter, option).Decode(&result)
	if err != nil {
		log.Fatal(err)
	}

	return result
}

// GetMessages : Finds the Message of an instrument based on the timestamp requested
func (c *Connector) GetMessages(instrument string, timestamp uint64, latestFullSnapshot uint64) (results []*models.Message) {
	collection := c.Database("graphelier-db").Collection("messages")
	filter := bson.D{
		{Key: "instrument", Value: instrument},
		{Key: "timestamp", Value: bson.D{
			{Key: "$lte", Value: timestamp},
			{Key: "$gte", Value: latestFullSnapshot},
		}},
	}

	findOptions := options.Find()

	cursor, err := collection.Find(context.TODO(), filter, findOptions)
	if err != nil {
		log.Fatal(err)
	}

	for cursor.Next(context.TODO()) {
		var m models.Message
		err := cursor.Decode(&m)
		if err != nil {
			log.Fatal(err)
		}

		results = append(results, &m)
	}

	if err := cursor.Err(); err != nil {
		log.Fatal(err)
	}

	cursor.Close(context.TODO())

	return results
}
