package neonserver

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
	GroupID int
	GroupName string
	Likes int
	Dislikes int
	Reposts []int
	UserID int
	UserName string
	UserFullName string
	UserImage string
	PostTime time.Time
	TimeDescription string
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

type APIGroupResponse struct  {
	GroupID int
	GroupName string
	GroupCreatorID int
	GroupCreatorName string
	GroupCreatorUsername string
	GroupCreatorUserImage string
	MyRole int
	Posts []APIPostResponse
	MemberIDs []int
	MemberImages []string
}

type APIDashboardResponse struct {
	User APIUserResponse
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
		} else if response.RequestType == "group" {
			if response.RequestDetail == "create" {
				CreateGroup(r, &response)
			} else if response.RequestDetail == "join" {
				JoinGroup(r, &response)
			} else if response.RequestDetail == "mine" {
				MyGroups(r, &response)
			} else if response.RequestDetail == "all" {
				AllGroups(r, &response)
			} else {
				GroupInfo(r, &response)
			}
		} else if response.RequestType == "dashboard" {
			Dashboard(r, &response)
		} else if response.RequestType == "post" {
			PostToGroup(r, &response)
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
		username := strings.ToLower(r.FormValue("username"))
		for i := 0; i < len(Users); i++ {
			if Users[i].Username == username && Users[i].HashedPassword == hashedPassword {
				user := Users[i]
				dateNow := time.Now()
				keyEndTime := dateNow.AddDate(0, 1, 0) //New date one month away
				keyString := randomKey()
				key := Key{keyString, user.ID, dateNow, keyEndTime}
				AddKey(&key)
				
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
					user.RealName = realName
					AddUser(&user)
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
		response.Data = apiUserResponseForUser(userDetail, true)
		
	} else {
		response.SuccessCode = 404
		response.Message = "Couldn't find user"
		e("API", "Couldn't find user " + userSearchKey)
	}
}

func apiUserResponseForUser(userDetail User, posts bool) APIUserResponse {
	apiUserResponse := APIUserResponse{}
	
	apiUserResponse.Username = userDetail.Username
	apiUserResponse.UserID = userDetail.ID
	apiUserResponse.Name = userDetail.RealName
	apiUserResponse.UserImage = userDetail.UserImageURL
	apiUserResponse.GroupIDs = make([]int, 0)
	apiUserResponse.GroupNames = make([]string, 0)
	apiUserResponse.Posts = make([]APIPostResponse, 0)
	
	for i := 0; i < len(GroupMembers); i++ {
		if GroupMembers[i].User == userDetail.ID {
			apiUserResponse.GroupIDs = append(apiUserResponse.GroupIDs, GroupMembers[i].Group)
			apiUserResponse.GroupNames = append(apiUserResponse.GroupNames, GroupNameFromID(GroupMembers[i].Group))
		}
	}
	
	//The user will only have posts if they are actually a member of a group
	if len(apiUserResponse.GroupIDs) > 0 && posts {
		for i := len(Posts) - 1; i >= 0; i-- {
			if Posts[i].User == userDetail.ID {
				apiPostResponse := PostResponseForPost(Posts[i])
				apiUserResponse.Posts = append(apiUserResponse.Posts, apiPostResponse)
			}
		}
	}
	
	return apiUserResponse
}

//This will get an APIPostResponse based on a Post object, removing unnecessary detail
//and adding additional detail that reduces the number of future requests client side
//logic has to request
func PostResponseForPost(post Post) APIPostResponse {
	apiPostResponse := APIPostResponse{}
	apiPostResponse.PostID = post.ID
	apiPostResponse.UserID = post.User
	user := UserForId(post.User)
	apiPostResponse.UserName = user.Username
	apiPostResponse.UserFullName = user.RealName
	apiPostResponse.UserImage = user.UserImageURL
	apiPostResponse.PlainText = post.Text
	apiPostResponse.HTML = HTMLForText(post.Text)
	apiPostResponse.PostTime = post.PostTime
	apiPostResponse.TimeDescription = GetTimeDescription(post.PostTime)
	apiPostResponse.GroupID = post.Group
	apiPostResponse.GroupName = GroupNameFromID(post.Group)
	apiPostResponse.Likes = 0
	apiPostResponse.Dislikes = 0
	apiPostResponse.Reposts = make([]int, 0)
	
	for i := 0; i < len(Likes); i++ {
		if Likes[i].Post == post.ID {
			if Likes[i].Like == 1 {
				apiPostResponse.Likes++
			} else if Likes[i].Like == -1 {
				apiPostResponse.Dislikes++
			}
		}
	}
	
	for i := 0; i < len(Reposts); i++ {
		if Reposts[i].Original == post.ID {
			apiPostResponse.Reposts = append(apiPostResponse.Reposts, Reposts[i].Repost)
		}
	}
	
	return apiPostResponse
}

//This function generates the HTML from the plain text of a post. I plan to allow it
//to pass Markdown (esp. links) in the future
func HTMLForText(text string) string {
	text = strings.Replace(text, "<", "&lt;", -1)
	text = strings.Replace(text, ">", "&gt;", -1)
	return "<p>" + text + "</p>"
}


//Create Group
func CreateGroup(r * http.Request, response * APIResponse) {
	if r.FormValue("name") != "" && r.FormValue("name") != "create" && r.FormValue("name") != "join" {
		group := Group{}
		group.Creator = UserForName(r.FormValue("username")).ID
		group.Name = r.FormValue("name")
		
		AddGroup(&group)
		
		addUserToGroup(group.Creator, group.ID, 1)
		
		response.Data = getGroupInfo(group.ID, 0)
	} else {
		response.SuccessCode = 400
		response.Message = "Group name required"
	}
}

func addUserToGroup(user, group, role int) {
	
	for i := 0; i < len(GroupMembers); i++ {
		if GroupMembers[i].User == user && GroupMembers[i].Group == group && GroupMembers[i].Role <= role {
			return
		}
	}
	
	groupMember := GroupMember{}
	groupMember.Group = group
	groupMember.User = user
	groupMember.Role = role
	
	AddGroupMember(&groupMember)
}

//Join group
func JoinGroup(r * http.Request, response * APIResponse) {
	if r.FormValue("group") != "" {
		groupId, err := strconv.ParseInt(r.FormValue("group"), 0, 0)
		if err == nil {
			index := GroupIndexForId(int(groupId))
			if index >= 0 {
				//Group exists
				group := Groups[GroupIndexForId(int(groupId))]
				addUserToGroup(UserForName(r.FormValue("username")).ID, group.ID, 0)
				response.Data = getGroupInfo(int(groupId), 100)
			} else {
				response.SuccessCode = 404
				response.Message = "Group ID not found"
			}
		} else {
			response.SuccessCode = 400
			response.Message = "Group ID not valid integer"
		}
	} else {
		response.SuccessCode = 400
		response.Message = "Group ID required"
	}
}

func GroupInfo(r * http.Request, response * APIResponse) {
	if response.RequestDetail != "" {
		groupId, err := strconv.ParseInt(response.RequestDetail, 0, 0)
		if err == nil {
			response.Data = getGroupInfo(int(groupId), 100)
			response.Message = "Found group"
		} else {
			response.SuccessCode = 400
			response.Message = "Group ID not valid integer"
		}
	} else {
		response.SuccessCode = 404
		response.Message = "Group ID required"
	}
}

func getGroupInfo(groupId, maxPosts int) APIGroupResponse {
	apiGroupResponse := APIGroupResponse{}
	group := GroupForId(groupId)
	apiGroupResponse.GroupID = group.ID
	apiGroupResponse.GroupName = group.Name
	apiGroupResponse.GroupCreatorID = group.Creator
	groupCreatorUser := UserForId(group.Creator)
	apiGroupResponse.GroupCreatorUsername = groupCreatorUser.Username
	apiGroupResponse.GroupCreatorName = groupCreatorUser.RealName
	apiGroupResponse.GroupCreatorUserImage = groupCreatorUser.UserImageURL
	
	apiGroupResponse.Posts = make([]APIPostResponse, 0)
	
	for i := len(Posts) - 1; i >= 0 && len(apiGroupResponse.Posts) < maxPosts; i-- {
		if Posts[i].Group == groupId {
			apiPostResponse := PostResponseForPost(Posts[i])
			apiGroupResponse.Posts = append(apiGroupResponse.Posts, apiPostResponse)
		}
	}
	
	apiGroupResponse.MemberIDs = make([]int, 0)
	apiGroupResponse.MemberImages = make([]string, 0)
	
	for i := 0; i < len(GroupMembers); i++ {
		if GroupMembers[i].Group == groupId && GroupMembers[i].Role > -1 {
			apiGroupResponse.MemberIDs = append(apiGroupResponse.MemberIDs, GroupMembers[i].User)
			apiGroupResponse.MemberImages = append(apiGroupResponse.MemberImages, UserForId(GroupMembers[i].User).UserImageURL)
			
			if len(apiGroupResponse.MemberIDs) > 100 {
				break
			}
		}
	}
	
	return apiGroupResponse
}

func Dashboard(r * http.Request, response * APIResponse) {
	dashboard := APIDashboardResponse{}
	dashboard.User = apiUserResponseForUser(UserForName(r.FormValue("username")), false)
	dashboard.Posts = make([]APIPostResponse, 0)
	
	total := 0
	limit := 100
	offset := 0
	
	if r.FormValue("offset") != "" {
		off, err := strconv.ParseInt(r.FormValue("offset"), 0, 0)
		if err == nil {
			offset = int(off)
		}
	}
	
	//Do a backwards search
	for i := len(Posts) - 1; i >= 0; i-- {
		if Posts[i].User == dashboard.User.UserID || in(Posts[i].Group, dashboard.User.GroupIDs) {
			total++
				if total - offset <= limit && total - offset > 0 {
					dashboard.Posts = append(dashboard.Posts, PostResponseForPost(Posts[i]))
				} else if total - offset > limit {
					break
				}
			
		}
	}
	
	response.Message = "Fetched Dashboard for User " + r.FormValue("username")
	response.SuccessCode = 200
	response.Data = dashboard
}

func PostToGroup(r * http.Request, response * APIResponse) {
	if r.FormValue("content") != "" && r.FormValue("group") != "" {
		postContent := r.FormValue("content")
		groupIdInt64, err := strconv.ParseInt(r.FormValue("group"), 0, 0)
		userDetail := UserForName(r.FormValue("username"))
		if len(postContent) > 0 && len(postContent) < 1000 && err == nil {
			groupId := int(groupIdInt64)
			//This function will also confirm whether or not the group exists
			if UserIsMemberOfGroup(userDetail.ID, groupId) {
				post := Post{}
				post.Text = postContent
				post.User = userDetail.ID
				post.Group = groupId
				post.PostTime = time.Now()
				AddPost(&post)
				response.Data = PostResponseForPost(post)
				response.SuccessCode = 200
				response.Message = "Successfully created post"
			} else {
				response.Message = "User is not a member of this group"
				response.SuccessCode = 400
			}
		} else {
			response.Message = "Group ID not valid or post not within correct length"
			response.SuccessCode = 400
		}
	} else {
		response.Message = "No content for post / group ID"
		response.SuccessCode = 400
	}
}

//Confirm whether or not a user is a member of a group
func UserIsMemberOfGroup(user, group int) bool {
	if !GroupExists(group) {
		return false
	}
	for i := 0; i < len(GroupMembers); i++ {
		if GroupMembers[i].User == user && GroupMembers[i].Group == group {
			return true
		}
	}
	return false
}

//Confirm whether or not a group exists
func GroupExists(group int) bool {
	for i := 0; i < len(Groups); i++ {
		if Groups[i].ID == group {
			return true
		}
	}
	return false
}

func in(value int, list []int) bool {
	for i := 0; i < len(list); i++ {
		if list[i] == value {
			return true
		}
	}
	return false
}

func GetTimeDescription(datetime time.Time) string {
	now := time.Now()
	dur := now.Sub(datetime)
	if dur.Seconds() <= 60 {
		return "Moments ago"
	} else if dur.Minutes() < 60 {
		s := ""
		if int(dur.Minutes()) > 1 {
			s = "s"
		}
		return fmt.Sprintf("%d minute%s ago", int(dur.Minutes()), s)
	} else if dur.Hours() < 24 {
		s := ""
		if int(dur.Hours()) > 1 {
			s = "s"
		}
		return fmt.Sprintf("%d hour%s ago", int(dur.Hours()), s)
	} else if dur.Hours() < 48 {
		return "Yesterday"
	}
	daysAgo := int(dur.Hours() / 24.0)
	s := ""
	if daysAgo > 1 {
		s = "s"
	}
	return fmt.Sprintf("%d day%s ago", daysAgo, s)
}

func MyGroups(r * http.Request, response * APIResponse) {
	user := UserForName(r.FormValue("username"))
	var groups []APIGroupResponse = make([]APIGroupResponse, 0)
	for i := 0; i < len(GroupMembers); i++ {
		if GroupMembers[i].User == user.ID {
			groupInfo := getGroupInfo(GroupMembers[i].Group, 0)
			groupInfo.MyRole = GroupMembers[i].Role
			groups = append(groups, groupInfo)
		}
	}
	response.Data = groups
	response.Message = "Found all groups user is member of"
}

func AllGroups(r * http.Request, response * APIResponse) {
	var groups []APIGroupResponse = make([]APIGroupResponse, 0)
	for i := 0; i < len(Groups); i++ {
		groupInfo := getGroupInfo(Groups[i].ID, 0)
		groups = append(groups, groupInfo)
	}
	response.Data = groups
	response.Message = "Found all groups"
}