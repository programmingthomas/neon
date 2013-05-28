//This file is aimed at creating a simple way of interacting with a JSON
//data store quickly. It is, however, designed specifically for Neon
package neon

import (
	"encoding/json"
	"time"
	"os"
	"io/ioutil"
)

type User struct {
	ID int
	Username string
	RealName string
	HashedPassword string
	UserImageURL string
}

type Key struct {
	Key string
	User int
	StartTime time.Time
	EndTime time.Time
}

type Group struct {
	ID int
	Name string
	Creator int
	GroupColor int
}

type GroupMember struct {
	ID int
	Group int
	User int
	Role int
}

type Post struct {
	ID int
	Text string
	User int
	PostTime time.Time
	Deleted int
	Group int
}

type Repost struct {
	ID int
	Original int
	Repost int
}

type LikeDislike struct {
	User int
	Post int
	Like int
}

type Message struct {
	ID int
	Sender int
	Receiver int
	SendTime time.Time
	Text string
	Read int
	DirectTo int
}

var Users []User
var Keys []Key
var Groups []Group
var GroupMembers []GroupMember
var Posts []Post
var Reposts []Repost
var Likes []LikeDislike
var Messages []Message

func StartDatabase() {
	if !DatabasesExist() {
		CreateDatabases()
	}
	LoadAllDatabases()
}

func LoadAllDatabases() {
	LoadDatabase(&Users, "users")
	LoadDatabase(&Keys, "keys")
	LoadDatabase(&Groups, "groups")
	LoadDatabase(&GroupMembers, "groupmembers")
	LoadDatabase(&Posts, "posts")
	LoadDatabase(&Reposts, "reposts")
	LoadDatabase(&Likes, "likes")
	LoadDatabase(&Messages, "messages")
	info("Database", "Loaded all databases")
}

func LoadDatabase(data interface{}, name string) {
	contents, _ := ioutil.ReadFile(name + storeExtension)
	json.Unmarshal(contents, &data)
}

func CreateDatabases() {
	Users = make([]User, 0)
	Keys = make([]Key, 0)
	Groups = make([]Group, 0)
	GroupMembers = make([]GroupMember, 0)
	Posts = make([]Post, 0)
	Reposts = make([]Repost, 0)
	Likes = make([]LikeDislike, 0)
	Messages = make([]Message, 0)
	info("Database", "Created databases")
	SaveAllDatabases()
}

func SaveAllDatabases() {
	SaveDatabase(Users, "users")
	SaveDatabase(Keys, "keys")
	SaveDatabase(Groups, "groups")
	SaveDatabase(GroupMembers, "groupmembers")
	SaveDatabase(Posts, "posts")
	SaveDatabase(Reposts, "reposts")
	SaveDatabase(Likes, "likes")
	SaveDatabase(Messages, "messages")
	info("Database", "Saved all databases")
}

func SaveDatabase(data interface{}, name string) {
	b, _ := json.Marshal(data)
	file, _ := os.Create(name + storeExtension)
	file.Write(b)
	file.Close()
	info("Database", "Wrote " + name)
}

func DatabasesExist() bool {
	return FileExists("users" + storeExtension) &&
		FileExists("keys" + storeExtension) &&
		FileExists("groups" + storeExtension) &&
		FileExists("groupmembers" + storeExtension) && 
		FileExists("posts" + storeExtension) &&
		FileExists("reposts" + storeExtension) &&
		FileExists("likes" + storeExtension) &&
		FileExists("messages" + storeExtension)
}

//API Helper functions

func UserForId(id int) User {
	for i := 0; i < len(Users); i++ {
		if Users[i].ID == id {
			return Users[i]
		}
	}
	return User{}
}

func GroupForId(id int) Group {
	for i := 0; i < len(Groups); i++ {
		if Groups[i].ID == id {
			return Groups[i]
		}
	}
	return Group{}
}

func UserForName(username string) User {
	for i := 0; i < len(Users); i++ {
		if Users[i].Username == username {
			return Users[i]
		}
	}
	return User{}
}


func IsUser(user User) bool {
	return user.Username != ""
}

func UserForUserNameExists(username string) bool {
	return IsUser(UserForName(username))
}

func UserLikesDislikesPost(user, post, level int) {
	//Firstly check if the user has already liked the post
	found := false
	for i := 0; i < len(Likes); i++ {
		if Likes[i].Post == post && Likes[i].User == user {
			if Likes[i].Like == level {
				Likes[i].Like = 0
			} else {
				Likes[i].Like = level
			}
			found = true
			break
		}
	}
	if !found {
		like := LikeDislike{user, post, level}
		Likes = append(Likes, like)
	}
	SaveDatabase(&Likes, "likes")
}