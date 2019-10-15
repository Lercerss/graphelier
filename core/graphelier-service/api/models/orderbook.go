package models

// Orderbook : A struct that represents the entire orderbook
type Orderbook struct {
	Instrument string `json:"instrument"`
	Bids       []struct {
		Price  float64 `json:"price"`
		Orders []struct {
			ID       uint64 `json:"id" bson:"id"`
			Quantity uint64 `json:"quantity"`
		} `json:"orders"`
	} `json:"bids"`
	Asks []struct {
		Price  float64 `json:"price"`
		Orders []struct {
			ID       uint64 `json:"id" bson:"id"`
			Quantity uint64 `json:"quantity"`
		} `json:"orders"`
	} `json:"asks"`
	Timestamp float64 `json:"timestamp"`
}
