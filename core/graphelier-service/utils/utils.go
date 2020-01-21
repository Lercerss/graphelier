package utils

import (
	"time"

	log "github.com/sirupsen/logrus"
)

// Abs : Default Abs func for golang takes a float and returns a float. Need one for ints
func Abs(n int64) int64 {
	if n < 0 {
		return -n
	}
	return n
}

func DebugTimer(call interface{}) func() {
	start := time.Now()
	return func() {
		log.Debugf("%s took %v\n", call, time.Since(start))
	}
}

func TraceTimer(call interface{}) func() {
	start := time.Now()
	return func() {
		log.Tracef("%s took %v\n", call, time.Since(start))
	}
}

var Timer func(interface{}) func() = DebugTimer
