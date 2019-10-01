package cnxn

import(
	"context"
	"fmt"
	"log"
	"sync"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// DBConnection : Struct for singelton implementation
type DBConnection struct {
	C *mongo.Client
}

var instance *DBConnection
var once sync.Once

// GetInstance : A singleton that gets one and only one instance of the database connection 
func GetInstance() *DBConnection {
    once.Do(func() {
        instance = &DBConnection{}
    })
		return instance
}

// Connect : The connection to the database
func (db *DBConnection) Connect() {
	clientOptions := options.Client().ApplyURI("mongodb://mongo:27017/graphelier-db")
	client, err := mongo.Connect(context.TODO(), clientOptions)

	if err != nil {
		log.Fatal(err)
	} else {
		db.C = client
	}

	err = client.Ping(context.TODO(), nil)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Connected to MongoDB :)")
}
