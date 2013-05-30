package neonserver

import (
	"time"
	"os"
)

//This function allows you to determine if a file exists
func FileExists(path string) bool {
	_, err := os.Stat(path)
	if err == nil {
		return true
	}
	return false
}

//This function returns the time.Time that a file was last modified at
func LastMod(path string) (time.Time) {
	fileInfo, _ := os.Stat(path)
	return fileInfo.ModTime()
}