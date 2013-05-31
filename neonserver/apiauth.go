//This file manages authorisation such as login/registration and authorisation
//of generic API requests. I broke it out from api.go to reduce the amount of code
//and make it more reusable
package neonserver

import 
(
	"net/http"
	"crypto/md5"
	"math/rand"
	"bytes"
	"regexp"
	"io"
	"time"
	"strings"
	"fmt"
)
//This will provide a Login response to confirm whether or not the user has logged in
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

func Validate(original string, regex string, minLength int, maxLength int) bool {
	if len(original) > maxLength || len(original) < minLength {
		return false
	}
	matched, _ := regexp.MatchString(regex, original)
	return matched
}

func userNameIsValid(username string) bool {
	return Validate(username, "^[a-z]+$", 1, 16) && !usernameIsBanned(username)
}

func usernameIsBanned(username string) bool {
	//These user names cause problems, so we have to check for them
	bannedUsernames := []string{"null", "hitler", "shit", "turd", "god", "ihateneon", "neon"}
	for i := 0; i < len(bannedUsernames); i++ {
		if username == bannedUsernames[i] {
			return true
		}
	}
	return false
}

func nameIsValid(name string) bool {
	return Validate(name, "^[A-Za-z ]+$", 1, 50)
}

//This will register a new user (and log them in) if the server allows registration,
//the username is valid (all lowercase letters, less than 16 characters long), the
//password is longer than five characters and the username is not taken
func Register(r * http.Request, response * APIResponse) {
	if AllowsRegister {
		if r.FormValue("username") != "" && r.FormValue("password") != "" && r.FormValue("name") != "" {
			username := r.FormValue("username")
			password := r.FormValue("password")
			realName := r.FormValue("name")
			if len(password) > 5 && userNameIsValid(username) && nameIsValid(realName) {
				if !UserForUserNameExists(username) {
					//The password is acceptable, the username is untake and acceptable
					//Sign up user
					user := User{}
					user.Username = username
					user.HashedPassword = hashString(password)
					user.UserImageURL = "userImages/default.png"
					user.RealName = realName
					AddUser(&user)
				
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

//Determines whether or not the request being made is authorised
//With a username/password (not recommended) or usename/key
func RequestIsAuth(r * http.Request) bool {
	if r.FormValue("username") != "" && r.FormValue("key") != "" {
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
	return false
}

//Generate the md5 hash of a string so that we don't include the raw password
//in the database
func hashString(original string) string {
	h := md5.New()
	io.WriteString(h, original)
	return fmt.Sprintf("%x", h.Sum(nil))
}

//Generates a sudo random key for use with logging in. This key could be any letter
//(upper or lower case) or number and is 64 characters long. Clients should submit
//the generated key when making respects
func randomKey() string {
	var buffer bytes.Buffer
	possibles := "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	for i := 0; i < 64; i++ {
		buffer.Write([]byte{possibles[rand.Intn(len(possibles))]})
	}
	return buffer.String()
}

//This will find and destroy a key by setting the end time to before the start time,
//so that the key can never be used again. This will *not* log the user out everywhere,
//however.
func Logout(r * http.Request, response * APIResponse) {
	user := UserForName(r.FormValue("username"))
	response.Message = "Logout " + r.FormValue("username")
	for i := 0; i < len(Keys); i++ {
		if Keys[i].Key == r.FormValue("key") && Keys[i].User == user.ID {
			Keys[i].EndTime = Keys[i].StartTime
			SaveDatabase(&Keys, "keys")
			break
		}
	}
}