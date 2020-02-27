package db

import (
	"context"

	"graphelier/core/graphelier-service/models"
	"graphelier/core/graphelier-service/utils"

	log "github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Datastore interface containing all queries to the database
type Datastore interface {
	GetOrderbook(instrument string, timestamp uint64) (*models.Orderbook, error)
	GetMessagesByTimestamp(instrument string, timestamp uint64) ([]*models.Message, error)
	GetMessagesByTimestampRange(instrument string, startTimestamp, endTimestamp uint64) ([]*models.Message, error)
	GetMessagesWithPagination(instrument string, paginator *models.Paginator) ([]*models.Message, error)
	GetSingleMessage(instrument string, sodOffset int64) (*models.Message, error)
	GetInstruments() ([]string, error)
	RefreshCache() error
	GetSingleOrderMessages(instrument string, SODTimestamp int64, EODTimestamp int64, orderID int64) ([]*models.Message, error)
	GetTopOfBookByInterval(instrument string, startTimestamp uint64, endTimestamp uint64, maxCount int64) (results []*models.Point, err error)
}

// Connector : A struct that represents the database
type Connector struct {
	*mongo.Client
	cache Cache
}

// Cache : A struct that represents a collection of db data
type Cache struct {
	meta map[string]Meta
}

// Meta : A struct that represents dynamic data for an instrument
type Meta struct {
	Instrument string
	Interval   uint64
}

// InstrumentNotFoundError : error type for missing instrument in database
type InstrumentNotFoundError struct {
	error
	Instrument string
}

func (err InstrumentNotFoundError) Error() string {
	return "Instrument not found: " + err.Instrument
}

func timestampToIntervalMultiple(timestamp uint64, interval uint64) uint64 {
	return (timestamp - (timestamp % interval)) / interval
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

	c := &Connector{client, Cache{}}
	if err = c.RefreshCache(); err != nil {
		return nil, err
	}

	log.Info("Connected to MongoDB :)\n")

	return c, nil
}

// GetOrderbook : Finds the Orderbook of an instrument based on the timestamp requested in the db
func (c *Connector) GetOrderbook(instrument string, timestamp uint64) (result *models.Orderbook, err error) {
	defer utils.TraceTimer("mongo/GetOrderbook")()

	meta, ok := c.cache.meta[instrument]
	if !ok {
		return nil, InstrumentNotFoundError{Instrument: instrument}
	}
	interval := meta.Interval

	exactTimestamp := timestampToIntervalMultiple(timestamp, interval)

	collection := c.Database("graphelier-db").Collection("orderbooks")
	filter := bson.D{
		{Key: "instrument", Value: instrument},
		{Key: "interval_multiple", Value: bson.D{
			{Key: "$lte", Value: exactTimestamp},
		}},
	}
	options := options.FindOne()
	options.SetSort(bson.D{{Key: "interval_multiple", Value: -1}})

	err = collection.FindOne(context.TODO(), filter, options).Decode(&result)
	if err != nil {
		return nil, err
	}

	result.Timestamp = result.Timestamp * interval

	return result, nil
}

// GetMessagesByTimestamp : Finds the Message of an instrument based on the timestamp requested
func (c *Connector) GetMessagesByTimestamp(instrument string, timestamp uint64) ([]*models.Message, error) {
	instrumentMeta, found := c.cache.meta[instrument]
	if !found {
		return nil, InstrumentNotFoundError{Instrument: instrument}
	}
	latestFullSnapshot := timestamp / instrumentMeta.Interval * instrumentMeta.Interval
	return c.GetMessagesByTimestampRange(instrument, latestFullSnapshot, timestamp+1)
}

// GetMessagesByTimestampRange : Finds the Message of an instrument based on the timestamp requested
func (c *Connector) GetMessagesByTimestampRange(instrument string, startTimestamp, endTimestamp uint64) (results []*models.Message, err error) {
	defer utils.TraceTimer("mongo/GetMessagesByTimestampRange")()

	collection := c.Database("graphelier-db").Collection("messages")
	filter := bson.D{
		{Key: "instrument", Value: instrument},
		{Key: "timestamp", Value: bson.D{
			{Key: "$gte", Value: startTimestamp},
			{Key: "$lt", Value: endTimestamp},
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
	defer utils.TraceTimer("mongo/GetMessagesWithPagination")()

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
	defer utils.TraceTimer("mongo/GetSingleMessage")()

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
	defer utils.TraceTimer("mongo/GetInstruments")()

	for r := range c.cache.meta {
		result = append(result, r)
	}

	if len(result) == 0 {
		log.Info("No instruments found in the cache, try refreshing the cache\n")
	}

	return result, nil
}

// RefreshCache : Updates in-memory cache of meta db values
func (c *Connector) RefreshCache() error {
	defer utils.TraceTimer("mongo/RefreshCache")()

	collection := c.Database("graphelier-db").Collection("meta")
	filter := bson.D{}
	options := options.Find()

	cursor, err := collection.Find(context.TODO(), filter, options)
	if err != nil {
		return err
	}

	result := make(map[string]Meta)
	defer cursor.Close(context.TODO())

	for cursor.Next(context.TODO()) {
		var m Meta
		err := cursor.Decode(&m)
		if err != nil {
			return err
		}

		result[m.Instrument] = m
	}
	c.cache.meta = result
	return nil
}

// GetSingleOrderMessages returns all messages affecting an order for a given day
func (c *Connector) GetSingleOrderMessages(instrument string, SODTimestamp int64, EODTimestamp int64, orderID int64) (results []*models.Message, err error) {
	defer utils.TraceTimer("mongo/GetSingleOrderMessages")

	collection := c.Database("graphelier-db").Collection("messages")

	filter := bson.D{
		{Key: "instrument", Value: instrument},
		{Key: "order_id", Value: orderID},
		{Key: "timestamp", Value: bson.D{
			{Key: "$gte", Value: SODTimestamp},
			{Key: "$lte", Value: EODTimestamp},
		}},
	}

	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "instrument", Value: 1}, {Key: "timestamp", Value: 1}})

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

// helper function for GetTopOfBookByInterval, finds points based on a large interval given
func getBigTopBookInterval(filter *bson.D, collection *mongo.Collection, interval uint64) (results []*models.Point, err error) {
	// Project snapshots to keep only the best bid and ask
	findOptions := options.Find()
	findOptions.Projection = bson.D{
		{Key: "interval_multiple", Value: 1},
		{Key: "bids", Value: bson.D{{Key: "$slice", Value: 1}}},
		{Key: "asks", Value: bson.D{{Key: "$slice", Value: 1}}},
		{Key: "bids.price", Value: 1},
		{Key: "asks.price", Value: 1},
	}

	cursor, err := collection.Find(context.TODO(), filter, findOptions)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	for cursor.Next(context.TODO()) {
		var p models.Point
		var raw bson.RawValue
		if raw, err = cursor.Current.LookupErr("interval_multiple"); err != nil {
			return nil, err
		}
		p.Timestamp = uint64(raw.Int64()) * interval

		if raw, err = cursor.Current.LookupErr("bids"); err != nil {
			return nil, err
		}
		rawE, err := raw.Array().IndexErr(0)
		if err != nil {
			continue
		}
		p.BestBid = rawE.Value().Document().Lookup("price").Double()

		if raw, err = cursor.Current.LookupErr("asks"); err != nil {
			return nil, err
		}
		rawE, err = raw.Array().IndexErr(0)
		if err != nil {
			continue
		}
		p.BestAsk = rawE.Value().Document().Lookup("price").Double()

		results = append(results, &p)
	}

	return results, err
}

// GetTopOfBookByInterval : Reads the best bid and best ask from order book snapshots in the given interval
func (c *Connector) GetTopOfBookByInterval(instrument string, startTimestamp uint64, endTimestamp uint64, maxCount int64) (results []*models.Point, err error) {
	defer utils.TraceTimer("mongo/GetTopOfBookByInterval")()

	meta, ok := c.cache.meta[instrument]
	if !ok {
		return nil, InstrumentNotFoundError{Instrument: instrument}
	}
	interval := meta.Interval

	exactStart := timestampToIntervalMultiple(startTimestamp, interval)
	exactEnd := timestampToIntervalMultiple(endTimestamp, interval)

	collection := c.Database("graphelier-db").Collection("orderbooks")
	filter := bson.D{
		{Key: "instrument", Value: instrument},
		{Key: "interval_multiple", Value: bson.D{
			{Key: "$gte", Value: exactStart},
			{Key: "$lte", Value: exactEnd},
		}},
	}

	// Count matching documents to select $mod filter
	count, err := collection.CountDocuments(context.TODO(), filter)
	if err != nil {
		return nil, err
	}

	// if maxCount < count, find points with big interval (mongo query)
	// else find points with small interval
	if maxCount < count {
		log.Tracef("Documents in orderbook interval {%d,%d}=%d, keeping 1 in %d", startTimestamp/interval, endTimestamp/interval, count, count/maxCount)
		// Add $mod comparator to interval_multiple filter
		filter[1].Value = append(filter[1].Value.(bson.D), bson.E{Key: "$mod", Value: bson.A{count / maxCount, 0}})

		results, err = getBigTopBookInterval(&filter, collection, interval)
		if err != nil {
			return nil, err
		}
	} else {
		orderbook, err := c.GetOrderbook(instrument, startTimestamp)
		if err != nil {
			return nil, err
		}
		messagesBeforeInterval, err := c.GetMessagesByTimestamp(instrument, startTimestamp)
		if err != nil {
			return nil, err
		}
		orderbook.ApplyMessagesToOrderbook(messagesBeforeInterval)
		messagesInterval, err := c.GetMessagesByTimestampRange(instrument, startTimestamp, endTimestamp+1)
		if err != nil {
			return nil, err
		}
		pointDistance := (endTimestamp - startTimestamp) / uint64(maxCount)
		if pointDistance == 0 {
			pointDistance = 1
		}
		log.Tracef("Applying messages to keep points at every %d\n", pointDistance)
		results = orderbook.TopBookPerXNano(messagesInterval, uint64(pointDistance), startTimestamp, endTimestamp)
	}

	return results, nil
}
