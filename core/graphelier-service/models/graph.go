package models

// Point : A struct representing a single point on the graph
type Point struct {
	Timestamp uint64  `json:"timestamp,string"`
	BestBid   float64 `json:"best_bid" bson:"best_bid"`
	BestAsk   float64 `json:"best_ask" bson:"best_ask"`
}

// CreatePoint : Creates a single point for the top of book
func CreatePoint(orderbook *Orderbook, timestamp uint64) (p Point) {
	p.Timestamp = timestamp
	if len(orderbook.Bids) != 0 {
		p.BestBid = orderbook.Bids[0].Price
	}
	if len(orderbook.Asks) != 0 {
		p.BestAsk = orderbook.Asks[0].Price
	}
	return p
}

// CreateTopBook : Creates the top of book by appending and managing an array
func (point *Point) CreateTopBook(topbook []*Point, topbookLengthIndex uint64, messageTimestamp uint64) ([]*Point, uint64){
	if topbookLengthIndex > 0 && messageTimestamp == topbook[topbookLengthIndex-1].Timestamp {
		topbook[topbookLengthIndex-1] = point
	} else {
		topbook = append(topbook, point)
		topbookLengthIndex++
	}
	return topbook, topbookLengthIndex
}
