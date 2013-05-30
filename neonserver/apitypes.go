package neonserver

import "time"

//A type that will return the API response which can be JSONified and
//Sent to the client or managed in some other way
//This object is returned for all API requests regardless of authentication
//And status, however Data may be null if SuccessCode is not 200
type APIResponse struct {
	RequestType string
	RequestDetail string
	Message string
	SuccessCode int
	Data interface{}
	RequestTime int
}

//This is returned as the Data of an APIResponse when a user logs in or registers
//(Registration, if successfull - SuccessCode:200 - will redirect and return this)
type APILoginResponse struct {
	Username string
	KeyCode string
	UserID int
	Name string
	UserImage string
}

//This object is returned for any post response
//Please note that all fields are guarenteed
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

//Returned upon a request for a user
//Posts is not guarenteed if this is included as part of the detail for something else,
//Such as a group/dashboard
type APIUserResponse struct {
	Username string
	UserID int
	Name string
	UserImage string
	GroupIDs []int
	GroupNames []string
	Posts []APIPostResponse
	Background string
}

//Returned when detail for a group is requested. MyRole is currently not guarenteed
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

//The standard dashboard response contains detail for the current user and 
//all posts in their dashboard
type APIDashboardResponse struct {
	User APIUserResponse
	Posts []APIPostResponse
}