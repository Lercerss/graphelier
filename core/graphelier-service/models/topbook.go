package models

// TopBook : A struct that represents the top of book at some time
type TopBook struct {
	Timestamp uint64 `json:"timestamp,string"`
	TopBid    Level  `json:"top_bid"`
	TopAsk    Level  `json:"top_ask"`
}
