package hndlrs_test

import (
	"graphelier/core/graphelier-service/api/hndlrs"
	. "graphelier/core/graphelier-service/utils/test_utils"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFetchInstruments(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	mockedDB.EXPECT().GetInstruments().Return([]string{"TEST", "SPY", "AAPL"}, nil)

	var instruments []string
	err := MakeRequest(
		hndlrs.FetchInstruments, // Function under test
		mockedDB,
		"GET",
		"/instruments/",
		nil,
		&instruments,
	)
	assert.Nil(t, err)

	assert.Equal(t, 3, len(instruments))
}

func TestFetchInstrumentsNoValues(t *testing.T) {
	mockedDB := MockDb(t)
	defer Ctrl.Finish()

	mockedDB.EXPECT().GetInstruments().Return(make([]string, 0), nil)

	var instruments []string
	err := MakeRequest(
		hndlrs.FetchInstruments, // Function under test
		mockedDB,
		"GET",
		"/instruments/",
		nil,
		&instruments,
	)
	assert.Nil(t, err)

	assert.Equal(t, 0, len(instruments))
}
