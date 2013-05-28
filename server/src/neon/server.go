package neon

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

//This ensures that the correct Content-Type is served for a file
func ContentTypeForExtension(ext string) string {
	extensionTypes := map[string] string {
		"html"	: "text/html",
		"js"	: "application/javascript; charset=utf-8",
		"css"	: "text/css; charset=utf-8",
		"svg"	: "image/svg+xml",
	}
	contentType, exists := extensionTypes[ext]
	if exists {
		return contentType
	}
	return ""
}

//Handles all regular non-API requests that require loading a file
func ViewHandler(w http.ResponseWriter, r *http.Request) {
	//Defaults to index.html if the request is empty
	ext := "html"
	directory := "html"
	filename := "index-new.html"
	//Request is not empty, navigate to differnt resource
	if r.URL.Path != "/" {
		ext = path.Ext(r.URL.Path)[1:]
		directory, filename = path.Split(r.URL.Path)
	}
	fullPath := "../client" + FolderForType(ext, directory) + filename
	fileExists := FileExists(fullPath)
	if fileExists {
		lastModTime := LastMod(fullPath)
		//This checks whether or not the Header was submitted with If-Modified-Since, which reduces server IO
		if r.Header["If-Modified-Since"] != nil && cache {
			//RFC1123 is the standard date format used with HTTP
			headerTime, _ := time.Parse(time.RFC1123, r.Header["If-Modified-Since"][0])
			if !headerTime.Before(lastModTime) {
				w.WriteHeader(http.StatusNotModified)
				return
			}
		}
		//Writer the header and content
		if (cache) {
			w.Header().Add("Last-Modified", lastModTime.Format(time.RFC1123))
		}
		http.ServeFile(w, r, fullPath)
	} else {
		w.WriteHeader(http.StatusNotFound)
	}
}

//Handles API requests
func APIHandler(w http.ResponseWriter, r * http.Request) {
	w.Header().Add("Content-Type", "application/json")
	response := APIResponseForRequest(r)
	w.WriteHeader(response.SuccessCode)
	jsonData, _ := json.Marshal(response)
	w.Write(jsonData)
}

//StartNeon() allows you to execute the server
func StartNeon() {
	info("Server", "Starting Neon")
	StartDatabase()
	http.HandleFunc("/api/", APIHandler)
	http.HandleFunc("/", ViewHandler)
	http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
}