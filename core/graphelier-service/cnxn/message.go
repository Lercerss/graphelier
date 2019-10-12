package cnxn

// Message : A struct to hold message data
type Message struct {
	Instrument    string  `json:"instrument"`
	Timestamp     float64 `json:"timestamp"`
	MessageType   uint64  `json:"message_type" bson:"message_type"`
	OrderID       uint64  `json:"order_id" bson:"order_id"`
	ShareQuantity uint64  `json:"share_qty" bson:"share_quantity"`
	Price         float64 `json:"price"`
	Direction     int64   `json:"direction"`
}

// FindMessage : Finds the Message of an instrument based on the timestamp requested
// func FindMessage(instrument string, timestamp float64) *[]*Message {
// 	collection := cnxn.GetInstance().C.Database("graphelier-db").Collection("messages")
// 	filter := bson.D{{
// 		"timestamp",
// 		bson.D{{
// 			"$lt",
// 			timestamp,
// 		}},
// 	}}

// 	var results []*Message
// 	cursor, err := collection.Find(context.TODO(), filter, options.Find())
// 	if err != nil {
// 		log.Fatal(err)
// 	}

// 	for cursor.Next(context.TODO()) {
// 		var m Message
// 		err := cursor.Decode(&m)
// 		if err != nil {
// 			log.Fatal(err)
// 		}

// 		results = append(results, &m)
// 	}

// 	if err := cursor.Err(); err != nil {
// 		log.Fatal(err)
// 	}

// 	cursor.Close(context.TODO())

// 	return &results
// }
