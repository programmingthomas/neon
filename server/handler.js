var exec = require("child_process").exec;
var fs = require("fs");

function start(response, postData) {
	console.log("\033[32mHandle:\033[m Request handler 'start' was called.");

    response.writeHead(200, {"Content-Type": "text/html"});

	var body = "";
    response.write(body);

    response.end();
}

function upload(response, postData) {
	console.log("\033[32mHandle:\033[m Request handler 'upload' was called.");

	response.writeHead(200, {"Content-Type": "text/html"});

	var body = "";
    response.write(body);

	response.end();
}

function index(response, postData) {
	console.log("\033[32mHandle:\033[m Request handler 'index' was called.");

	response.writeHead(200, {"Content-Type": "text/html"});

	fs.readFile("../client/html/index.html", "utf8", function(err, data) {
		response.write(data);
		response.end();
	});
}

exports.start = start;
exports.upload = upload;
exports.index = index;