//Api.js Have fun!
var qs = require("querystring");
var url = require("url");
var log = require("./logger");

function api(command, option, parameters)
{
	var response = {};
	response.request = {};
	response.request.requestType = command;
	response.request.responseDetail = option;
	response.request.successCode = 200;
	response.request.parameters = parameters;
	return response;
}

function isApiRequest(requestUrl)
{
	var split = requestUrl.split("/");
	for (var i = 0; i < split.length; i++)
	{
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
	writeApi(api(method, option, parameters), response);
}

function writeApi(respObj, response)
{
	response.writeHead(respObj.request.successCode, {"Content-Type": "application/json" });
	if (respObj.request.parameters.whitespace != null) 
	{
		log.i("api.js", "Outputting whitespaced JSON");
		response.write(JSON.stringify(respObj, null, "\t"));
	}
	else response.write(JSON.stringify(respObj));
	response.end();
}


exports.api = api;
exports.isApiRequest = isApiRequest;
exports.runApi = runApi;
exports.writeApi = writeApi;