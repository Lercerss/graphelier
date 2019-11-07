package utils

// Abs : Default Abs func for golang takes a float and returns a float. Need one for ints
func Abs(n int64) int64 {
	if n < 0 {
		return -n
	}
	return n
}
