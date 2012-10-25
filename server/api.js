//Api.js
var qs = require("querystring");
var url = require("url");
var log = require("./logger");
var db  = require("./database");
var crypto = require("crypto");
var config = require("./config");

//---------------
//API ENTRY POINT
//---------------

function isApiRequest(requestUrl)
{
	//Split the array into component sessions
	var split = requestUrl.split("/");
	for (var i = 0; i < split.length; i++)
	{
		//Probably worth noting that this does mean that you cannot have api in a folder or filename
		//Never mind :P
		if (split[i] === "api") return true;
	}
	return false;
}

function runApi(request, response, parameters)
{
	var pathname = url.parse(request.url).href;
	var split = pathname.split("/");
	var method = "";
	var option = "";
	//This iterates over and sets the method and option (if URL is /api/user/thomas method = user and option = thomas)
	for (var i = 0; i < split.length; i++)
	{
		if (split[i] == "api")
		{
			if (i < split.length - 1) method = split[i + 1];
			if (i <  split.length - 2) option = split[i + 2];
			break;
		}
	}
	//Gets rid of ? in the method or option variables because they appear on GET requests and screw things up big time
	if (method.indexOf("?") >= 0) method = method.substr(0, method.indexOf("?"));
	if (option.indexOf("?") >= 0) option = option.substr(0, option.indexOf("?"));

	//Get the JSON response for the API and send it to the writeApi function so that it can be written out
	//You can optionally include ?whitespace on API requests which produces indented JSON which makes development easier
	writeApi(api(method, option, parameters), response, parameters.whitespace != null);
}

//Writes the information out
function writeApi(respObj, response, whitespace)
{
	//I send a 200 response by default because it was causing jQuery onresult code not to execute
	//You could reflect respoObj.request.successCode but this will probably screw things up
	//I'm sorry
	response.writeHead(200, {"Content-Type": "application/json" });
	//I can't remember what the null did but the \t ensures that there is a tab
	//Alternatively switch it to four spaces
	if (whitespace)
		response.write(JSON.stringify(respObj, null, "\t"));
	else response.write(JSON.stringify(respObj));
	//End the response and send back to the client
	response.end();
}

//--------------
//API CONTROLLER
//--------------

function api(command, option, parameters)
{
	//The response object is a native JavaScript that gets returned
	//It is fed back to the client as a JSON object
	var response = {};
	response.request = {};
	response.request.requestType = command;
	response.request.requestDetail = option;
	response.request.successCode = 200;

	//This logs a lot. You can disable logging in config
	log.i("api.js", "Request for command " + command);

	//This if-elseif branch manages all API reqiests 
	if (command == "register")
	{
		//Some schools may choose to block registrations
		if (config.allowsRegister)
		{
			log.i("api.js", "Asked to register " + parameters.username);
			//There is a helper function for this!
			register(parameters.username, parameters.password, parameters.name, response);
			//After registration a login object will be carried out, but registration could fail
			if (response.request.successCode == 200)
			{
				//A login response will be returned if a registration was requested
				login(parameters.username, parameters.password, response);
			}
		}
		else
		{
			//Send back a message to say that the server doesn't support registrations
			response.request.successCode = 401;
			response.request.message = "Sorry, this Neon server doesn't allow user registration";
		}
	}
	else if (command == "login")
	{
		//This will push out the default login stuff
		log.i("api.js", "Asked to login" + parameters.username);
		login(parameters.username, parameters.password, response);
	}
	//Login and register are the only methods that don't require authentication. I check here that a username and either password or key is sent
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
					for  (var n = 0; n < groups.length; n++)
					{
						if (groups[n].id == db.posts.table[i].groupId)
						{
							posts[posts.length] = getPost(db.posts.table[i].id, false, true);
							break;
						}
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
			var ps = [];
			var groups = currentUserGroups(user(parameters.username).id);
			for (var i = 0; i < db.posts.table.length; i++)
			{
				if (db.posts.table[i].deleted == 0)
				{
					for (var n = 0; n < groups.length; n++)
					{
						if (groups[n].id == db.posts.table[i].groupId)
						{
							ps[ps.length] = getPost(db.posts.table[i].id, true, true);
							break;
						}
					}
				}
			}
			log.i("api.js", "There are " + ps.length + " items in the dashboard for #" + user(parameters.username).id);
			response.posts = ps;
		}
		else if (command == "logout")
		{
			var userId = user(parameters.username).id;
			for (var i = 0; i < db.keys.table.length; i++) if (db.keys.table[i] != null && db.keys.table[i].user == userId) delete db.keys.table[i];
			response.request.message = "All keys destroyed, logged out";
			db.saveTo(db.keys, "keys");
		}
	}
	else
	{
		response.request.successCode = 401;
		response.request.message = "Could not authenticate the user";
	}

	return response;
}

function getPost(id, includeUser, includeGroup)
{
	var p = db.postForId(id);
	var u = db.userForId(p.user);
	var g = db.groupForId(p.groupId);
	var post = {};
	post.id = p.id;
	post.plainText = p.plainText;
	post.html = "<p>" + post.plainText + "</p>";
	post.time = p.time;
	if (includeUser)
	{
		post.user = {};
		post.user.id = u.id;
		post.user.name = u.name;
		post.user.username = u.username;
		post.user.userImage = u.userImage;
	}
	if (includeGroup)
	{
		post.group = {};
		post.group.id = g.id;
		post.group.name = g.name;
		post.group.color = g.color;
	}
	return post;
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
	post.groupId = group;
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

exports.api = api;
exports.isApiRequest = isApiRequest;
exports.runApi = runApi;
exports.writeApi = writeApi;