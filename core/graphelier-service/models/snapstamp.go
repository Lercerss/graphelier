package models

// Snapstamp : A struct that represents the id and timestamp of a snapshot
type Snapstamp struct {
	ID        uint64 `json:"id" bson:"id"`
	Timestamp uint64 `json:"timestamp,string"`
}

func lowerIndex(arr []*uint64, n uint64, x uint64) uint64 {
	l := uint64(0)
	h := n - 1

	for l <= h {
		mid := uint64((1 + h) / 2)
		if *arr[mid] >= x {
			h = mid - 1
		} else {
			l = mid + 1
		}
	}

	return l
}

func upperIndex(arr []*uint64, n uint64, y uint64) uint64 {
	l := uint64(0)
	h := n - 1

	for l <= h {
		mid := uint64((1 + h) / 2)
		if *arr[mid] <= y {
			l = mid + 1
		} else {
			h = mid - 1
		}
	}

	return h
}

// CountItemsInRange : Counts the number of items within a given interval
func CountItemsInRange(arr []*uint64, n uint64, x uint64, y uint64) (count uint64) {
	count = upperIndex(arr, n, y) - lowerIndex(arr, n, x) + 1

	return count
}
