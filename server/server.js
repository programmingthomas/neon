var http = require("http");
var url = require("url");
var path = require("path");
var dns = require("dns");
var log = require("./logger");
var os = require("os");

var port = 1337;

function start(route) {
	function onRequest(request, response) {
		var parameters;
		var postData = "";
		var pathname = url.parse(request.url).href;

		if (pathname === "" || pathname === "/") {
			pathname = "index.html";
		}

		log.i("server.js", "Request for " + pathname + " received.");

		request.setEncoding("utf8");
	
		if (request.method == 'GET')
		{
			parameters = url.parse(request.url, true).query;
			route(pathname, request, response, parameters);
		}
		else if (request.method == 'POST')
		{
			var body = '';
	        request.on('data', function (data) {
	            body += data;
	        });
	        request.on('end', function () {

	            parameters = qs.parse(body);
	            route(pathname, request, response, parameters);
	        });
		}
		

	}
	
	http.createServer(onRequest).listen(port);

	log.i("server.js", "Server running on port " + port.toString() + ".");
}

exports.start = start;

