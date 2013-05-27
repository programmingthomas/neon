package neon

import (
	"net/http"
	"strings"
)

//A type that will return the API response which can be JSONified and
//Sent to the client or managed in some other way
type APIResponse struct {
	RequestType string
	RequestDetail string
	SuccessCode int
	Data interface{}
}

//Examines the API request and delegates work out to the appropriate
//function before returning the APIResponse object for JSONification
func APIResponseForRequest(r * http.Request) APIResponse {
	requestPath := r.URL.Path
	requestPathSplit := strings.Split(requestPath, "/")
	response := APIResponse{"", "", 100, nil}
	response.SuccessCode = 200
	passedAPI := false
	passedType := false
	for i := 0; i < len(requestPathSplit); i++ {
		if requestPathSplit[i] == "api" {
			passedAPI = true
		} else if passedAPI && !passedType {
			response.RequestType = requestPathSplit[i]
			passedType = true
		} else if requestPathSplit[i] != "" {
			response.RequestDetail = requestPathSplit[i]
			break
		}
	}
	
	if (response.RequestType == "login") {
		Login(map[string] string{}, &response)
	}
	
	return response
}

func Login(parameters map[string] string, response * APIResponse) {
	
}