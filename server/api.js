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
			if (option == null || option == undefined) response.user = user(parameters.username);
			response.user = user(option);
		}
	}
	else
	{
		response.request.successCode = 401;
		response.request.message = "Could not authenticate the user";
	}

	return response;
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
						servGroup.role = 1;
						response.login.grous[response.login.groups.length] = servGroup;
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
	user.image = "images/" + user.id.toString() + ".png";
	db.users.table[db.users.table.length] = user;
	db.users.index += 1;
	db.saveTo(db.users, "users");
	db.loadUserIndexes();
	log.i("api.js", "Successfully registered user " + username);
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