//The log functions make it easy to log server events
//TODO: Log to file
package neonserver

import (
	"fmt"
	"runtime"
)

//This will determine whether or not the package was built for windows
//Note that runtime.GOOS doesn't reflect the current OS but reflects the architecture
//the application was built for, such as 'windows', 'darwin' or 'linux'
func IsWindows() bool {
	return runtime.GOOS == "windows"
}

//Log something with a specific color
//The color will be ignored on Windows because the command prompt doesn't support colors
func Log(color, source, message string) {
	if ShouldLog {
		if runtime.GOOS == "windows" {
			fmt.Printf("%s\t%s", source, message)
		} else {
			fmt.Printf("%s%s:\033[0m\t%s\n", color, source, message)
		}
	}
}

//Log an error
func e(source, message string) {
	Log("\033[91m", source, message)
}

//Log a warning
func warn(source, message string) {
	if !ShouldOnlyLogErrors {
		Log("\033[93m", source, message)
	}
}

//Log information
func info(source, message string) {
	if !ShouldOnlyLogErrors {
		Log("\033[92m", source, message)
	}
}

//What a Terrible Failure
func wtf(source, message string) {
	e(source, message)
}