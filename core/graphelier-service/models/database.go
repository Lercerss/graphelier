package models

import (
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Data : An interface with methods for the database
type Data interface {
	FindOrderbook() (result *Orderbook)
}

// DB : A sruct for the database
type DB struct {
	*mongo.Client
}

// Connect : The database connection
func Connect() (*DB, error) {
	clientOptions := options.Client().ApplyURI("mongodb://mongo:27017/graphelier-db")
	client, err := mongo.Connect(context.TODO(), clientOptions)

	if err != nil {
		log.Fatal(err)
	}

	if err = client.Ping(context.TODO(), nil); err != nil {
		log.Fatal(err)
	}
	fmt.Println("Connected to MongoDB :)")

	return &DB{client}, nil
}
