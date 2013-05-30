//This file defines the types (structs) that are used by the database
//I split this out to make it easier to add code to database.go
//whilst viewing this
package neonserver

import "time"

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
}

type GroupMember struct {
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
