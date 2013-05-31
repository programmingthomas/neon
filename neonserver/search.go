//This file handles all search requests through the API
package neonserver

import ( 
	"strings"
	"regexp"
	"strconv"
	"net/http"
)

//Searches all posts and finds posts that meet the criteria
func SearchPosts(r * http.Request, response * APIResponse) {
	if r.FormValue("query") != "" && SearchQueryIsValid(r.FormValue("query")) {
		regexQuery := RegexForQuery(r.FormValue("query"))
		info("Search", r.FormValue("query") + " -> " + regexQuery)
		max := 100
		if r.FormValue("limit") != "" {
			v, err := strconv.ParseInt(r.FormValue("limit"), 0, 0)
			if err == nil && int(v) < max{
				max = int(v)
			}
		}
		postsMatching := make([]APIPostResponse, 0)
		for i := len(Posts) - 1; i >= 0; i-- {
			matched, _ := regexp.MatchString(regexQuery, Posts[i].Text)
			if matched {
				postsMatching = append(postsMatching, PostResponseForPost(Posts[i]))
				if len(postsMatching) == max {
					break
				}
			}
		}
		response.Data = postsMatching
		response.Message = "Successfully queried posts"
	} else {
		response.Message = "You must submit a query"
		response.SuccessCode = 403
	}
}

//Determines whether or the search query meets valid conditions
func SearchQueryIsValid(query string) bool {
	return Validate(query, "^[A-Za-z0-9\\+ ]+$", 1, 100)
}

//Gets the regular expression for a query in the form firstWord+secondWord+thirdWord+etc
func RegexForQuery(query string) string {
	words := strings.Split(query, " ")
	//I probably ought to use a byte.Buffer for this however the terms will be short and
	//the queries have to be shorter than 100 characters
	regex := "("
	for index, word := range words {
		regex += word
		if index != len(words) - 1 {
			regex += "|"
		}
	} 
	return regex + ")"
}