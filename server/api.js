//Api.js Have fun!
var qs = require("querystring");
var url = require("url");
var log = require("./logger");
var db  = require("./database");
var crypto = require("crypto");
var config = require("./config");

//THIS IS WHERE ALL CORE API CODE GOES
function api(command, option, parameters)
{
	var response = {};
	response.request = {};
	response.request.requestType = command;
	response.request.requestDetail = option;
	response.request.successCode = 200;
	log.i("api.js", "Request for command " + command);
	if (command == "register")
	{
		if (config.allowsRegister)
		{
			log.i("api.js", "Asked to register " + parameters.username);
			register(parameters.username, parameters.password, parameters.name, response);
			if (response.request.successCode == 200)
			{
				//A login response will be returned if a registration was requested
				login(parameters.username, parameters.password, response);
			}
		}
		else
		{
			response.request.successCode = 401;
			response.request.message = "Sorry, this Neon server doesn't allow user registration";
		}
	}
	else if (command == "login")
	{
		log.i("api.js", "Asked to login" + parameters.username);
		login(parameters.username, parameters.password, response);
	}
	else if (isAuthenticated(parameters.username, parameters.password, parameters.key))
	{
		//Good, good
		log.i("api.js", "User " + parameters.username + " is authenticated");
		if (command == "user")
		{
			var servUser, u;
			if (option == null || option == undefined || option.length == 0) u = user(parameters.username);
			else u = user(option);
			servUser = {};
			servUser.username = u.username;
			servUser.userImage = u.userImage;
			servUser.id = u.id;
			response.user = servUser;
			var groups = currentUserGroups(servUser.id);
			servUser.groups = groups;
			var posts = [];
			for (var i = 0; i < db.posts.table.length; i++)
			{
				if (db.posts.table[i].user == servUser.id && db.posts.table[i].deleted == 0)
				{
					var doPost = false;
					for  (var n = 0; n < groups.length; n++)
					{
						if (groups[n].id == db.posts.table[i].group)
						{
							doPost = true;
							break;
						}
					}
					if (doPost)
					{
						posts[posts.length] = db.posts.table[i];
					}
				}
			}
			servUser.posts = posts;
			//This will need some more stuff related to serving up posts...
		}
		else if (command == "group" && option == "create")
		{
			log.i("api.js", "Creating a group");
			response.group = createGroup(parameters.name, parameters.username)
		}
		else if (command == "post")
		{
			response.id = post(parameters.groupId, user(parameters.username).id, parameters.content);
			if (response.id < 0)
			{
				response.request.statusCode = 401;
				response.request.message = "I'm sorry. You can't post in that group."
			}
		}
		else if (command == "dashboard")
		{
			var posts = [];
			var groups = currentUserGroups(user(parameters.username).id);
			for (var i = 0; i < db.posts.table.length; i++)
			{
				if (db.posts.table[i].deleted == 0)
				{
					for (var n = 0; n < groups.length; n++)
					{
						if (groups[n].id == db.posts.table[i].group)
						{
							posts[posts.length] = db.posts.table[i];
							posts[posts.length - 1].group = groups[n];
						}
					}
				}
			}
			response.posts = posts;
		}
	}
	else
	{
		response.request.successCode = 401;
		response.request.message = "Could not authenticate the user";
	}

	return response;
}

function currentUserGroups(user)
{
	var a = [];
	for (var i = 0; i < db.members.table.length; i++)
	{
		if (db.members.table[i].user == user)
		{
			var group = db.groupForId(db.members.table[i].group);
			if (group)
			{
				var servGroup = {};
				servGroup.id = group.id;
				servGroup.name = group.name;
				servGroup.color = group.color;
				//servGroup.role = 1;
				a[a.length] = servGroup;
			}
		}
	}
	return a;
}

function createGroup(name, creator)
{
	var group = {};
	group.id = db.groups.index;
	db.groups.index++;
	group.name = name;
	group.creator = db.userForName(creator).id;
	group.color = "#FFCC00";
	db.groups.table[db.groups.table.length] = group;
	var groupMember = {};
	groupMember.group = group.id;
	groupMember.user = group.creator;
	db.members.table[db.members.table.length] = groupMember;
	db.saveTo(db.members, "members");
	db.saveTo(db.groups, "groups");
	return group;
}

function login(username, password, response)
{
	//Get a hashed copy of the password for quicker searching
	var hashedPassword = hash(password);
	for (var i = 0; i < db.users.table.length; i++)
	{
		//Does the user match?
		if (db.users.table[i].username == username && db.users.table[i].password == hashedPassword)
		{
			//A key is now generated
			var key = {};
			key.user = db.users.table[i].id;
			//Total seconds since Jan 1 1970
			key.startDate = Math.floor(Date.now() / 1000);
			//60 * 60 * 24 * 30 = total number of seconds in 30 days. i.e. thirty days from now
			key.endDate = key.startDate + (60 * 60 * 24 * 30);
			//Get random key
			key.key = randomKey();
			db.keys.table[db.keys.table.length] = key;
			db.saveTo(db.keys, "keys");
			response.login = {};
			response.login.username = db.users.table[i].username;
			response.login.key = key.key;
			response.login.userId = db.users.table[i].id;
			response.login.name = db.users.table[i].name;
			response.login.userImage = db.users.table[i].userImage;
			response.request.message = "Logged in";
			response.login.groups = [];
			for (var n = 0; n < db.members.table.length; n++)
			{
				if (db.members.table[i].user == response.login.userId)
				{
					var group = db.groupForId(db.members.table[i].group);
					if (group)
					{
						var servGroup = {};
						servGroup.id = group.id;
						servGroup.name = group.name;
						servGroup.color = group.color;
						//servGroup.role = 1;
						response.login.groups[response.login.groups.length] = servGroup;
					}
				}
			}

			return;
		}
	}
	response.request.successCode = 401;
	response.request.message = "Couldn't find user";
}

function usernameIsValid(username)
{
	if (username != null || username == undefined || username.length == 0)
	{
		return true;
	}
	else return false;
}

function randomKey()
{
	var text = "";
	//These are standard characters when encoding base 64 so I thought I would use those.
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	for (var i = 0; i < 64; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}

function register(username, password, name, response)
{
	if (username.length == 0 || password.length <= 5 || name.length == 0)
	{
		log.e("api.js", "Couldn't register " + username)
		response.request.message = "Username/Name too short or password not at least 5 letters";
		response.request.successCode = 401;
		return;
	}
	if (db.userForName(username) != null)
	{
		log.e("api.js", "Couldn't register " + username + " because " + username + " already taken.");
		response.request.message = "Username already taken";
		response.request.successCode = 401;
		return;
	}
	var user = {};
	user.id = db.users.index;
	user.name = name;
	user.username = username;
	user.password = hash(password);
	user.userImage = "userImages/" + user.id.toString() + ".png";
	db.users.table[db.users.table.length] = user;
	db.users.index += 1;
	db.saveTo(db.users, "users");
	db.loadUserIndexes();
	log.i("api.js", "Successfully registered user " + username);
}

function post(group, user, text)
{
	group = parseInt(group);
	text = text.replace(/(<([^>]+)>)/ig, "");
	var good = false;
	for (var i = 0; i < db.members.table.length; i++)
	{
		if (db.members.table[i].user == user && db.members.table[i].group == group)
		{
			good = true;
			break;
		}
	}
	if (!good)
	{
		log.e("api.js", "Couldn't post to group " + group + " because user " + user + " is not a member.");
		return -1;
	}
	var post = {}
	post.id = db.posts.index;
	db.posts.index++;
	post.plainText = text;
	post.user = user;
	post.time = Math.floor(Date.now() / 1000);
	post.deleted = 0;
	post.group = group;
	db.posts.table[db.posts.table.length] = post;
	db.saveTo(db.posts, "posts");
	return post.id;
}

function user(username)
{
	var user;
	if (isNaN(username)) user = db.userForName(username);
	else user = db.userForId(username);
	return user;
}

function hash(phrase)
{
	return crypto.createHash('md5').update(phrase).digest('hex');
}

function isAuthenticated(username, password, key)
{
	var user = db.userForName(username);
	var now = Math.floor(Date.now() / 1000);
	if (user)
	{
		if (password == undefined && key == undefined) return true;
		else if (password != undefined && user.password == hash(password)) return true;
		else if (key)
		{
			for (var i = 0; i < db.keys.table.length; i++)
			{
				if (db.keys.table[i].key == key && db.keys.table[i].user == user.id && now < db.keys.table[i].endDate) return true;
			}
		}
	}
	return false;
}

//Checks if an url is an api request
function isApiRequest(requestUrl)
{
	var split = requestUrl.split("/");
	for (var i = 0; i < split.length; i++)
	{
		if (split[i] === "api") return true;
	}
	return false;
}

//Runs the API
function runApi(request, response, parameters)
{
	var pathname = url.parse(request.url).href;
	var split = pathname.split("/");
	var method = "";
	var option = "";
	for (var i = 0; i < split.length; i++)
	{
		if (split[i] == "api")
		{
			if (i < split.length - 1) method = split[i + 1];
			if (i <  split.length - 2) option = split[i + 2];
			break;
		}
	}
	if (method.indexOf("?") >= 0) method = method.substr(0, method.indexOf("?"));
	if (option.indexOf("?") >= 0) option = option.substr(0, option.indexOf("?"));
	writeApi(api(method, option, parameters), response, parameters.whitespace != null);
}

//Writes the information out
function writeApi(respObj, response, whitespace)
{
	response.writeHead(respObj.request.successCode, {"Content-Type": "application/json" });
	if (whitespace)
		response.write(JSON.stringify(respObj, null, "\t"));
	else response.write(JSON.stringify(respObj));
	response.end();
}


exports.api = api;
exports.isApiRequest = isApiRequest;
exports.runApi = runApi;
exports.writeApi = writeApi;