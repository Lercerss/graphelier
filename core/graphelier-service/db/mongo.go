package db

import (
	"context"
	"log"

	"graphelier/core/graphelier-service/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Datastore interface containing all queries to the database
type Datastore interface {
	GetOrderbook(instrument string, timestamp uint64) (*models.Orderbook, error)
	GetMessages(instrument string, timestamp uint64, latestFullSnapshot uint64) ([]*models.Message, error)
	GetMessagesWithPagination(instrument string, timestamp int64, paginator *models.Paginator) ([]*models.Message, error)
}

// Connector : A struct that represents the database
type Connector struct {
	*mongo.Client
}

// NewConnection : The database connection
func NewConnection() (*Connector, error) {
	clientOptions := options.Client().ApplyURI("mongodb://mongo:27017/graphelier-db")
	client, err := mongo.Connect(context.TODO(), clientOptions)

	if err != nil {
		return nil, err
	}

	if err = client.Ping(context.TODO(), nil); err != nil {
		return nil, err
	}
	log.Println("Connected to MongoDB :)")

	return &Connector{client}, nil
}

// GetOrderbook : Finds the Orderbook of an instrument based on the timestamp requested in the db
func (c *Connector) GetOrderbook(instrument string, timestamp uint64) (result *models.Orderbook, err error) {
	collection := c.Database("graphelier-db").Collection("orderbooks")
	filter := bson.D{
		{Key: "instrument", Value: instrument},
		{Key: "timestamp", Value: bson.D{
			{Key: "$lte", Value: timestamp},
		}},
	}
	option := options.FindOne()
	option.SetSort(bson.D{{Key: "timestamp", Value: -1}})

	err = collection.FindOne(context.TODO(), filter, option).Decode(&result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

// GetMessages : Finds the Message of an instrument based on the timestamp requested
func (c *Connector) GetMessages(instrument string, timestamp uint64, latestFullSnapshot uint64) (results []*models.Message, err error) {
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
		return nil, err
	}
	defer cursor.Close(context.TODO())

	for cursor.Next(context.TODO()) {
		var m models.Message
		err := cursor.Decode(&m)
		if err != nil {
			return nil, err
		}

		results = append(results, &m)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return results, nil
}

// GetMessagesWithPagination returns an messages given an instrument, sod_offset with pagination
func (c *Connector) GetMessagesWithPagination(instrument string, sodOffset int64, paginator *models.Paginator) (results []*models.Message, err error) {
	collection := c.Database("graphelier-db").Collection("messages")
	var filterKey string
	var sortDirection int8
	if paginator.NMessages < 0 {
		filterKey = "$lt"
		sortDirection = -1
	} else {
		filterKey = "$gt"
		sortDirection = 1
	}
	filter := bson.D{
		{Key: "instrument", Value: instrument},
		{Key: "sod_offset", Value: bson.D{
			{Key: filterKey, Value: sodOffset},
		}},
	}

	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "instrument", Value: 1}, {Key: "sod_offset", Value: sortDirection}})
	findOptions.SetLimit(abs(paginator.NMessages))

	cursor, err := collection.Find(context.TODO(), filter, findOptions)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	for cursor.Next(context.TODO()) {
		var m models.Message
		err := cursor.Decode(&m)
		if err != nil {
			return nil, err
		}

		results = append(results, &m)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return results, nil
}

// Default Abs func for golang takes a float and returns a float. Need one for ints
func abs(n int64) int64 {
	if n < 0 {
		return -n
	}
	return n
}
