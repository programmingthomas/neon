//The log functions make it easy to log server events
//TODO: Log to file
package neon

import "fmt"

//Log something with a specific color
func log(color, source, message string) {
	if shouldLog {
		fmt.Printf("%s%s:\033[0m\t%s\n", color, source, message)
	}
}

//Log an error
func e(source, message string) {
	log("\033[91m", source, message)
}

//Log a warning
func warn(source, message string) {
	if !shouldOnlyLogErrors {
		log("\033[93m", source, message)
	}
}

//Log information
func info(source, message string) {
	if !shouldOnlyLogErrors {
		log("\033[92m", source, message)
	}
}