//This file handles all search requests through the API
package neonserver

import ( 
	"strings"
	"strconv"
	"net/http"
)

//Searches all posts and finds posts that meet the criteria
func SearchPosts(r * http.Request, response * APIResponse) {
	if r.FormValue("query") != "" && SearchQueryIsValid(r.FormValue("query")) {
		query := strings.Split(strings.ToLower(r.FormValue("query")), " ")
		max := 100
		if r.FormValue("limit") != "" {
			v, err := strconv.ParseInt(r.FormValue("limit"), 0, 0)
			if err == nil && int(v) < max{
				max = int(v)
			}
		}
		postsMatching := make([]APIPostResponse, 0)
		for i := len(Posts) - 1; i >= 0; i-- {
			matched := PostStringMatchesQuery(Posts[i].Text, query)
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

//Determines whether or not the post matches the query
func PostStringMatchesQuery(post string, query []string) bool {
	totalWordsMatching := 0
	//Convert to lowercase so that case can be ignored
	lowercasePost := strings.ToLower(post)
	for _, word := range query {
		if strings.Contains(lowercasePost, word) {
			totalWordsMatching++
		}
	}
	//If more than two thirds of the words appear then 
	return totalWordsMatching > (2 * len(query)) / 3
}