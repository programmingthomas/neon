package neonserver

import (
	"net/http"
	"fmt"
	"path"
	"time"
	"encoding/json"
)

//Some requests - such as index.html, css.css, *.js can be done without
//the need to specify the folder tat they are in
func FolderForType(ext, directory string) string {
	if ext == "html" || ext == "js" || ext == "css" {
		return "/" + ext + "/"
	} else if ext == "ico" {
		return ""
	}
	return directory
}

//Handles all regular non-API requests that require loading a file
func ViewHandler(w http.ResponseWriter, r *http.Request) {
	//Defaults to index.html if the request is empty
	ext := "html"
	directory := "html"
	filename := "index.html"
	//Request is not empty, navigate to differnt resource
	if r.URL.Path != "/" {
		ext = path.Ext(r.URL.Path)[1:]
		directory, filename = path.Split(r.URL.Path)
	}
	fullPath := "client" + FolderForType(ext, directory) + filename
	fileExists := FileExists(fullPath)
	if fileExists {
		lastModTime := LastMod(fullPath)
		//This checks whether or not the Header was submitted with 
		//If-Modified-Since, which reduces server IO, only do if Cache is enabled
		if r.Header["If-Modified-Since"] != nil && Cache {
			//RFC1123 is the standard date format used with HTTP
			headerTime, _ := time.Parse(time.RFC1123, r.Header["If-Modified-Since"][0])
			if !headerTime.Before(lastModTime) {
				w.WriteHeader(http.StatusNotModified)
				return
			}
		}
		//Writer the header and content
		if (Cache) {
			w.Header().Add("Last-Modified", lastModTime.Format(time.RFC1123))
		}

		//Go has a function for serving files easily
		//I used this function because it reduces the complexity of the code
		//And it seems to do a good job handling MIME types
		http.ServeFile(w, r, fullPath)
	} else {
		w.WriteHeader(http.StatusNotFound)
	}
}

//Handles API requests
func APIHandler(w http.ResponseWriter, r * http.Request) {
	//Set the current Content-Type for JSON (it is not the same as JavaScript)
	//And some tools require this
	w.Header().Add("Content-Type", "application/json")
	//This will get the APIResponse object from the API
	response := APIResponseForRequest(r)
	//No longer setting this to the same success code from the API
	//Because jQuery will only accept JS with 200 Status
	//If you are working on a client note 
	//w.WriteHeader(response.SuccessCode)
	w.WriteHeader(200)
	//The JSON package quickly formats a struct/interface into a JSON object
	//Note that it will only add the exported values, so all keys for the object
	//Ended up beginning with a capital letter (Capital == exported, lowercase == private)
	jsonData, _ := json.Marshal(response)
	w.Write(jsonData)
}

//StartNeon() allows you to execute the server
//Note that this start an infinite loop, so you cannot execute tasks after starting this
func StartNeon() {
	info("Server", "Starting Neon")
	//StartDatabase() will also create the database (.jsondb) files if necessary
	StartDatabase()
	//Send all API requests to APIHandler - I like this simplicity compared to NodeJS
	http.HandleFunc("/api/", APIHandler)
	//Send everything else to the ViewHandler
	http.HandleFunc("/", ViewHandler)
	//Start the HTTP serving on the port set in config.go
	http.ListenAndServe(fmt.Sprintf(":%d", Port), nil)
}