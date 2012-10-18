var http = require("http");
var url = require("url");
var path = require("path");

var port = 1337;

function start(route) {
	function onRequest(request, response) {
		var postData = "";
		var pathname = path.basename(url.parse(request.url).href);
		
		if (pathname === "") {
			pathname = "index.html";
		}

		console.log('\033[31mServer:\033[m Request for ' + pathname + ' recieved.');

		request.setEncoding("utf8");

		request.addListener("data", function(postDataChunk) {
			postData += postDataChunk;
			console.log('\033[31mServer:\033[m Recieved POST data chunk: ' + postDataChunk + '.');
		});

		request.addListener("end", function() {
			route(pathname, response, postData);
		});

	}
	
	http.createServer(onRequest).listen(port);
	console.log('\033[31mServer:\033[m Server running on port ' + port);
}

exports.start = start;

