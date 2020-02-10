package models

type Modification interface{}

type ModificationImpl struct {
	Type string `json:"type"`
}

type Modifications struct {
	Timestamp     uint64         `json:"timestamp,string"`
	Modifications []Modification `json:"modifications"`
}

func (m *Modifications) Add(modification Modification) {
	m.Modifications = append(m.Modifications, modification)
}

const (
	ADD_ORDER_TYPE    = "add"
	DROP_ORDER_TYPE   = "drop"
	UPDATE_ORDER_TYPE = "update"
	MOVE_ORDER_TYPE   = "move"
)

type AddOrder struct {
	ModificationImpl
	Price    float64 `json:"price"`
	Quantity int64   `json:"quantity"`
}

type DropOrder struct {
	ModificationImpl
	Price float64 `json:"price"`
	Index int32   `json:"index"`
}

type UpdateOrder struct {
	ModificationImpl
	Price    float64 `json:"price"`
	Index    int32   `json:"index"`
	Quantity int64   `json:"quantity"`
}

type MoveOrder struct {
	ModificationImpl
	From  float64 `json:"from"`
	Index int32   `json:"index"`
	To    float64 `json:"to"`
}

func NewAddModification(price float64, quantity int64) Modification {
	return &AddOrder{
		ModificationImpl: ModificationImpl{
			Type: ADD_ORDER_TYPE,
		},
		Price:    price,
		Quantity: quantity,
	}
}

func NewDropModification(price float64, index int32) Modification {
	return &DropOrder{
		ModificationImpl: ModificationImpl{
			Type: DROP_ORDER_TYPE,
		},
		Price: price,
		Index: index,
	}
}

func NewUpdateModification(price float64, index int32, quantity int64) Modification {
	return &UpdateOrder{
		ModificationImpl: ModificationImpl{
			Type: UPDATE_ORDER_TYPE,
		},
		Price:    price,
		Index:    index,
		Quantity: quantity,
	}
}

func NewMoveModification(from float64, index int32, to float64) Modification {
	return &MoveOrder{
		ModificationImpl: ModificationImpl{
			Type: MOVE_ORDER_TYPE,
		},
		From:  from,
		Index: index,
		To:    to,
	}
}
