package models

type Point struct {
	Timestamp uint64  `json:"timestamp,string"`
	BestBid   float64 `json:"best_bid" bson:"best_bid"`
	BestAsk   float64 `json:"best_ask" bson:"best_ask"`
}
