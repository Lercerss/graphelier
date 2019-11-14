package db

import (
	"context"
	"graphelier/core/graphelier-service/utils"
	"log"

	"graphelier/core/graphelier-service/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Datastore interface containing all queries to the database
type Datastore interface {
	GetOrderbook(instrument string, timestamp uint64) (*models.Orderbook, error)
	GetMessagesByTimestamp(instrument string, timestamp uint64) ([]*models.Message, error)
	GetMessagesWithPagination(instrument string, paginator *models.Paginator) ([]*models.Message, error)
	GetSingleMessage(instrument string, sodOffset int64) (*models.Message, error)
	GetInstruments() ([]string, error)
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
	options := options.FindOne()
	options.SetSort(bson.D{{Key: "timestamp", Value: -1}})

	err = collection.FindOne(context.TODO(), filter, options).Decode(&result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

// GetMessagesByTimestamp : Finds the Message of an instrument based on the timestamp requested
func (c *Connector) GetMessagesByTimestamp(instrument string, timestamp uint64) (results []*models.Message, err error) {
	divisor := uint64(10000000000)
	latestFullSnapshot := timestamp / divisor * divisor

	collection := c.Database("graphelier-db").Collection("messages")
	filter := bson.D{
		{Key: "instrument", Value: instrument},
		{Key: "timestamp", Value: bson.D{
			{Key: "$lte", Value: timestamp},
			{Key: "$gte", Value: latestFullSnapshot},
		}},
	}

	options := options.Find()

	cursor, err := collection.Find(context.TODO(), filter, options)
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
func (c *Connector) GetMessagesWithPagination(instrument string, paginator *models.Paginator) (results []*models.Message, err error) {
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
			{Key: filterKey, Value: paginator.SodOffset},
		}},
	}

	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "instrument", Value: 1}, {Key: "sod_offset", Value: sortDirection}})
	findOptions.SetLimit(utils.Abs(paginator.NMessages))

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

// GetSingleMessage : Returns the message corresponding to the sod_offset (message id)
func (c *Connector) GetSingleMessage(instrument string, sodOffset int64) (result *models.Message, err error) {
	collection := c.Database("graphelier-db").Collection("messages")
	filter := bson.D{
		{Key: "instrument", Value: instrument},
		{Key: "sod_offset", Value: sodOffset},
	}

	options := options.FindOne()

	err = collection.FindOne(context.TODO(), filter, options).Decode(&result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

// GetInstruments : Returns available instruments
func (c *Connector) GetInstruments() (result []string, err error) {
	collection := c.Database("graphelier-db").Collection("orderbooks")
	filter := bson.D{} // No filter

	res, err := collection.Distinct(context.TODO(), "instrument", filter, options.Distinct())
	if err != nil {
		return nil, err
	}

	for _, r := range res {
		result = append(result, r.(string))
	}

	return result, nil
}
