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

func userNameIsValid(username string) bool {
	length := len(username)
	if length == 0 || length > 16 {
		return false
	}
	matched, _ := regexp.MatchString("^[a-z]", username)
	return matched
}

func Register(r * http.Request, response * APIResponse) {
	if AllowsRegister {
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