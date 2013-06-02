//This file is aimed at creating a simple way of interacting with a JSON
//data store quickly. It is, however, designed specifically for Neon
package neonserver

import (
	"encoding/json"
	"os"
	"io/ioutil"
)

var Users []User
var Keys []Key
var Groups []Group
var GroupMembers []GroupMember
var Posts []Post
var Reposts []Repost
var Likes []LikeDislike
var Messages []Message

var UserIndicies []int
var GroupIndicies []int
var PostIndicies []int
var MessageIndicies []int

var InsertIndicies map[string] int

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
	
	if FileExists("indicies" + StoreExtension) {
		LoadDatabase(&InsertIndicies, "indicies")
	} else {
		InsertIndicies = map[string] int {
			"users" : 1,
			"groups" : 1,
			"posts" : 1,
			"messages" : 1,
		}
		InsertIndicies["users"] = intMax(1, len(Users) + 1)
		InsertIndicies["groups"] = intMax(1, len(Groups) + 1)
		InsertIndicies["posts"] = intMax(1, len(Posts) + 1)
		InsertIndicies["messages"] = intMax(1, len(Messages) + 1)
		SaveDatabase(InsertIndicies, "indicies")
	}
	
	LoadAllIndicies()
	
	info("Database", "Loaded all databases")
}

func LoadDatabase(data interface{}, name string) {
	contents, _ := ioutil.ReadFile(name + StoreExtension)
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
	InsertIndicies = map[string] int {
		"users" : 1,
		"groups" : 1,
		"posts" : 1,
		"messages" : 1,
	}
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
	SaveDatabase(InsertIndicies, "indicies")
	info("Database", "Saved all databases")
}

//TODO Defer
func SaveDatabase(data interface{}, name string) {
	b, _ := json.Marshal(data)
	file, _ := os.Create(name + StoreExtension)
	file.Write(b)
	file.Close()
}

func DatabasesExist() bool {
	return FileExists("users" + StoreExtension) &&
		FileExists("keys" + StoreExtension) &&
		FileExists("groups" + StoreExtension) &&
		FileExists("groupmembers" + StoreExtension) && 
		FileExists("posts" + StoreExtension) &&
		FileExists("reposts" + StoreExtension) &&
		FileExists("likes" + StoreExtension) &&
		FileExists("messages" + StoreExtension)
}

//API Helper functions

func UserForId(id int) User {
	if id < len(UserIndicies) && id > 0 {
		return Users[UserIndicies[id]]
	}
	return User{}
}

func GroupForId(id int) Group {
	if id < len(GroupIndicies) && id > 0 {
		return Groups[GroupIndicies[id]]
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

//Replace with a binary tree search because it will be much faster
func GroupIndexForId(id int) int {
	for i := 0; i < len(Groups); i++ {
		if Groups[i].ID == id {
			return i
		}
	}
	return -1
}

func GroupNameFromID(id int) string {
	return Groups[GroupIndexForId(id)].Name
}

func LoadAllIndicies() {
	LoadUserIndicies()
	LoadGroupIndicies()
	LoadPostIndicies()
	LoadMessageIndicies()
}

func LoadUserIndicies() {
	UserIndicies = make([]int, InsertIndicies["users"])
	for i := 0; i < len(Users); i++ {
		UserIndicies[Users[i].ID] = i
	}
}

func LoadGroupIndicies() {
	GroupIndicies = make([]int, InsertIndicies["groups"])
	for i := 0; i < len(Groups); i++ {
		GroupIndicies[Groups[i].ID] = i
	}
}

func LoadPostIndicies() {
	PostIndicies = make([]int, InsertIndicies["posts"])
	for i := 0; i < len(Posts); i++ {
		PostIndicies[Posts[i].ID] = i
	}
}

func LoadMessageIndicies() {
	MessageIndicies = make([]int, InsertIndicies["messages"])
	for i := 0; i < len(Messages); i++ {
		MessageIndicies[Messages[i].ID] = i
	}
}

/*
ADD FUNCTIONS
These should be preffered to other ways of adding data to the database
because they are fast and reliable
*/

//Add a Post
func AddPost(post * Post) {
	post.ID = InsertIndicies["posts"]
	InsertIndicies["posts"]++
	Posts = append(Posts, *post) //Have to add the pointer value, not the pointer
	SaveDatabase(Posts, "posts")
	SaveDatabase(InsertIndicies, "indicies")
	LoadPostIndicies()
}

//Add a user
func AddUser(user * User) {
	user.ID = InsertIndicies["users"]
	InsertIndicies["users"]++
	Users = append(Users, *user)
	SaveDatabase(Users, "users")
	SaveDatabase(InsertIndicies, "indicies")
	LoadUserIndicies()
}

//Add a group
func AddGroup(group * Group) {
	group.ID = InsertIndicies["groups"]
	InsertIndicies["groups"]++
	Groups = append(Groups, *group)
	SaveDatabase(Groups, "groups")
	SaveDatabase(InsertIndicies, "indicies")
	LoadGroupIndicies()
}

//Add a key (doesn't require an ID)
func AddKey(key * Key) {
	Keys = append(Keys, *key)
	SaveDatabase(Keys, "keys")
}

//Add a GroupMember
func AddGroupMember(groupMember * GroupMember) {
	GroupMembers = append(GroupMembers, *groupMember)
	SaveDatabase(GroupMembers, "groupmembers")
}

//Update a user
func UpdateUser(user User) {
	for i, u := range Users {
		if u.ID == user.ID {
			Users[i] = user
			break
		}
	}
	SaveDatabase(Users, "users")
}

func intMax(a, b int) int {
	if a > b {
		return a
	} 
	return b
}