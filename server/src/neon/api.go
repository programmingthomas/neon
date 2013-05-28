package neon

import (
	"net/http"
	"strings"
	"crypto/md5"
	"time"
	"io"
	"math/rand"
	"fmt"
	"bytes"
	"regexp"
	"strconv"
)

//A type that will return the API response which can be JSONified and
//Sent to the client or managed in some other way
type APIResponse struct {
	RequestType string
	RequestDetail string
	Message string
	SuccessCode int
	Data interface{}
}

type APILoginResponse struct {
	Username string
	KeyCode string
	UserID int
	Name string
	UserImage string
}

type APIPostResponse struct {
	PostID int
	HTML string
	PlainText string
	GroupID string
	GroupName string
	Likes int
	Dislikes int
	Reposts []int
	UserID int
	UserName string
	UserFullName string
	PostTime time.Time
}

type APIUserResponse struct {
	Username string
	UserID int
	Name string
	UserImage string
	GroupIDs []int
	GroupNames []string
	Posts []APIPostResponse
}

//Examines the API request and delegates work out to the appropriate
//function before returning the APIResponse object for JSONification
func APIResponseForRequest(r * http.Request) APIResponse {
	requestPath := r.URL.Path
	requestPathSplit := strings.Split(requestPath, "/")
	response := APIResponse{"", "", "", 200, nil}
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
	
	if response.RequestType == "login" {
		Login(r, &response)
	} else if response.RequestType == "register" {
		Register(r, &response)
	} else if RequestIsAuth(r) {
		if response.RequestType == "user" {
			UserDetailPublic(r, &response)
		}
	} else {
		response.Message = "Authorisation is required"
		wtf("API", "Authorisation is required")
	}
	
	return response
}

func Login(r * http.Request, response * APIResponse) {
	if r.FormValue("username") != "" && r.FormValue("password") != "" {
		hashedPassword := hashString(r.FormValue("password"))
		username := r.FormValue("username")
		for i := 0; i < len(Users); i++ {
			if Users[i].Username == username && Users[i].HashedPassword == hashedPassword {
				user := Users[i]
				dateNow := time.Now()
				keyEndTime := dateNow.AddDate(0, 1, 0) //New date one month away
				keyString := randomKey()
				key := Key{keyString, user.ID, dateNow, keyEndTime}
				Keys = append(Keys, key)
				SaveDatabase(Keys, "keys")
				
				response.Message = "User successfully logged in"
				
				apiLoginResponse := APILoginResponse{}
				apiLoginResponse.Username = username
				apiLoginResponse.KeyCode = keyString
				apiLoginResponse.UserImage = user.UserImageURL
				apiLoginResponse.Name = user.RealName
				apiLoginResponse.UserID = user.ID
				
				response.Data = apiLoginResponse
				
				break
			}
		}
	} else {
		response.Message = "More information required for login"
		response.SuccessCode = 400 //More information required
	}
}

func userNameIsValid(username string) bool {
	length := len(username)
	if length == 0 || length > 16 {
		return false
	}
	matched, _ := regexp.MatchString("^[a-z]", username)
	return matched
}

func Register(r * http.Request, response * APIResponse) {
	if allowsRegister {
		if r.FormValue("username") != "" && r.FormValue("password") != "" && r.FormValue("name") != "" {
			username := r.FormValue("username")
			password := r.FormValue("password")
			realName := r.FormValue("name")
			if len(password) > 5 && userNameIsValid(username) {
				if !UserForUserNameExists(username) {
					//The password is acceptable, the username is untake and acceptable
					//Sign up user
					user := User{}
					user.Username = username
					user.HashedPassword = hashString(password)
					user.UserImageURL = "userImages/default.png"
					user.ID = len(Users) + 1
					user.RealName = realName
					Users = append(Users, user)
					SaveDatabase(Users, "users")
				
					info("API", "Successfully signed up user " + username)
				
					//Log the user in
					Login(r, response)
				} else {
					response.Message = "Username already taken"
					e("API", "Username already taken")
					response.SuccessCode = 400
				}
			} else {
				response.Message = "Values do not meet requirements"
				e("API", "Password is too short or username is invalid")
				response.SuccessCode = 400
			}
		} else {
			response.Message = "More information required"
			e("API", "Couldn't register user - not enough detail")
			response.SuccessCode = 400
		}
	} else {
		response.SuccessCode = 400
		response.Message = "Server doesn't allow registration"
	}
}

func RequestIsAuth(r * http.Request) bool {
	if r.FormValue("username") != "" {
		if r.FormValue("password") != "" {
			hashedPassword := hashString(r.FormValue("password"))
			for i := 0; i < len(Users); i++ {
				if Users[i].Username == r.FormValue("username") && Users[i].HashedPassword == hashedPassword {
					return true
				}
			}
		} else if r.FormValue("key") != "" {
			user := UserForName(r.FormValue("username"))
			if IsUser(user) {
				for i := 0 ; i < len(Keys); i++ {
					if Keys[i].User == user.ID && Keys[i].Key == r.FormValue("key") {
						timeNow := time.Now()
						if timeNow.After(Keys[i].StartTime) && timeNow.Before(Keys[i].EndTime) {
							return true
						}
					}
				}
			}
		}
	}
	return false
}

func hashString(original string) string {
	h := md5.New()
	io.WriteString(h, original)
	return fmt.Sprintf("%x", h.Sum(nil))
}

func randomKey() string {
	var buffer bytes.Buffer
	possibles := "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	for i := 0; i < 64; i++ {
		buffer.Write([]byte{possibles[rand.Intn(len(possibles))]})
	}
	return buffer.String()
}

func UserDetailPublic(r * http.Request, response * APIResponse) {
	userSearchKey := response.RequestDetail
	if userSearchKey == "" {
		userSearchKey = r.FormValue("username")
	}
	userId, err := strconv.ParseInt(userSearchKey, 0, 0)
	var userDetail User
	if err == nil {
		userDetail = UserForId(int(userId))
	} else {
		userDetail = UserForName(userSearchKey)
	}
	if userDetail.ID > 0 {
		response.SuccessCode = 200
		response.Message = "Found user " + userDetail.Username
		apiUserResponse := APIUserResponse{}
		
		//GroupIDs []int
		//GroupNames []string
		//Posts []APIPostResponse
		
		apiUserResponse.Username = userDetail.Username
		apiUserResponse.UserID = userDetail.ID
		apiUserResponse.Name = userDetail.RealName
		apiUserResponse.UserImage = userDetail.UserImageURL
		
		for i := 0; i < len(GroupMembers); i++ {
			if GroupMembers[i].User == userDetail.ID {
				apiUserResponse.GroupIDs = append(apiUserResponse.GroupIDs, GroupMembers[i].Group)
				apiUserResponse.GroupNames = append(apiUserResponse.GroupNames, GroupNameFromID(GroupMembers[i].Group))
			}
		}
		
		//The user will only have posts if they are actually a member of a group
		if len(apiUserResponse.GroupIDs) > 0 {
			
		}
		
		response.Data = apiUserResponse
		
	} else {
		response.SuccessCode = 404
		response.Message = "Couldn't find user"
		e("API", "Couldn't find user " + userSearchKey)
	}
}