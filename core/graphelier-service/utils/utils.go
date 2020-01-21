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

// DebugTimer : Returns a deferrable function to log (at DEBUG level) the amount of time taken in the given scope
func DebugTimer(call string) func() {
	start := time.Now()
	return func() {
		log.Debugf("%s took %v\n", call, time.Since(start))
	}
}

// TraceTimer : Returns a deferrable function to log (at TRACE level) the amount of time taken in the given scope
func TraceTimer(call string) func() {
	start := time.Now()
	return func() {
		log.Tracef("%s took %v\n", call, time.Since(start))
	}
}

// Timer : See DebugTimer
var Timer func(interface{}) func() = DebugTimer
