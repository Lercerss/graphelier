package models

// Paginator contains info about the page of data being requested
type Paginator struct {
	NMessages int64 `json:"nMessages"`
	SodOffset int64 `json:"sod_offset"`
}
