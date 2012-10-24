//Api.js Have fun!
var qs = require("querystring");
var url = require("url");
var log = require("./logger");
var db  = require("./database");
var crypto = require("crypto");

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
		log.i("api.js", "Asked to register " + parameters.username);
		register(parameters.username, parameters.password, parameters.password, response);
		if (response.request.successCode == 200)
		{
			login(parameters.username, parameters.password, response);
		}
	}
	else if (command == "login")
	{
		log.i("api.js", "Asked to login" + parameters.username);
		login(parameters.username, parameters.password, response);
	}

	return response;
}

function login(username, password, response)
{
	var hashedPassword = hash(password);
	for (var i = 0; i < db.users.table.length; i++)
	{
		if (db.users.table[i].username == username && db.users.table[i].password == hashedPassword)
		{
			//They are a real user after that!
			var key = {};
			key.user = db.users.table[i].id;
			key.startDate = Math.floor(Date.now() / 1000);
			key.endDate = key.startDate + (60 * 60 * 24 * 30);
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
			return;
		}
	}
	response.request.successCode = 401;
	response.request.message = "Couldn't find user";
}

function randomKey()
{
	var text = "";
	var possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,";
	for (var i = 0; i < 64; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}

function register(username, password, name, response)
{
	if (username.length == 0 || password.length <= 5 || name.length == 0)
	{
		response.request.message = "Username/Name too short or password not at least 5 letters";
		response.request.successCode = 401;
		return;
	}
	for (var i = 0; i < db.users.table.length; i++)
	{
		if (db.users.table[i].username == username)
		{
			response.request.message = "Username already taken";
			response.request.successCode = 401;
			return;
		}
	}
	var user = {};
	user.id = db.users.index;
	user.name = name;
	user.username = username;
	user.password = hash(password);
	user.image = "images/" + user.id.toString() + ".png";
	db.users.table[user.id] = user;
	db.users.index += 1;
	db.saveTo(db.users, "users");
}

function hash(phrase)
{
	return crypto.createHash('md5').update(phrase).digest('hex');
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