var http = require("http");
var url = require("url");
var path = require("path");
var dns = require("dns");
var log = require("./logger");
var os = require("os");

var port = 1337;

function start(route) {
	function onRequest(request, response) {
		var postData = "";
		var pathname = path.basename(url.parse(request.url).href);
		
		if (pathname === "") {
			pathname = "index.html";
		}

		log.i("server.js", "Request for " + pathname + " received.");

		request.setEncoding("utf8");

		request.addListener("data", function(postDataChunk) {
			postData += postDataChunk;
			//ARE WE SERIOUSLY LOGGING ALL POST REQUESTS?! it was for testing purposes ;)
			log.i("server.js", "Received POST data chunk: " + postDataChunk + ".");
		});

		request.addListener("end", function() {
			route(pathname, response, postData);
		});

	}
	
	http.createServer(onRequest).listen(port);

	log.i("server.js", "Server running on port " + port.toString() + ".");
}

exports.start = start;

