package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestExistsMultiple(t *testing.T) {
	multiple, _ := ExistsMultiple(5,1,2)
	assert.Equal(t, uint64(4), multiple)

	multiple, _ = ExistsMultiple(12,6, 6)
	assert.Equal(t, uint64(12), multiple)

	multiple, _ = ExistsMultiple(112,48, 3)
	assert.Equal(t, uint64(111), multiple)

	multiple, _ = ExistsMultiple(13, 3, 7)
	assert.Equal(t, uint64(7), multiple)

	multiple, _ = ExistsMultiple(32, 25, 17)
	assert.Equal(t, uint64(0), multiple)
}
