var exec = require("child_process").exec;
var fs = require("fs");
var path = require("path");
var config = require("./config");
var log = require("./logger");

var fileExtensionTypes = [];
fileExtensionTypes[".html"] = "text/html";
fileExtensionTypes[".css"] = "text/css";
fileExtensionTypes[".js"] = "text/javascript";
fileExtensionTypes[".svg"] = "image/svg+xml";
fileExtensionTypes[".ttf"] = "application/x-font-ttf";
fileExtensionTypes[".woff"] = "application/x-font-woff";

/*function displayPage(pathname, response, postData) {

	if (pathname === "") {
		pathname = "index.html";
	}

	log.i("handler.js", "Returning data for '" + pathname + "'");

	response.writeHead(200, {"Content-Type": "text/html"});

	fs.readFile("../client/html/" + pathname, "utf8", function(err, data) {
		response.write(data);
		response.end();
	});
}

function displayCss(pathname, response, postData) {

	log.i("handler.js", "Returning CSS for '" + pathname + "'");

	response.writeHead(200, {"Content-Type": "text/css"});

	fs.readFile("../client/css/" + pathname, "utf8", function(err, data) {
		response.write(data);
		response.end();
	});
}

function displayJs(pathname, response, postData) {

	log.i("handler.js", "Returning JS for '" + pathname + "'");

	response.writeHead(200, {"Content-Type": "text/javascript"});

	fs.readFile("../client/js/" + pathname, "utf8", function(err, data) {
		response.write(data);
		response.end();
	});
}*/

function displayResource(type, pathname, request, response, postData)
{
	fs.stat("../client/" + type + "/" + pathname, function(err, stat) {
		var etag = etag = stat.size + '-' + Date.parse(stat.mtime);
		response.setHeader("Last-Modified", stat.mtime);
		if (request.headers['if-none-match'] === etag && config.cache)
		{
			log.i("handler.js", "304: '" + pathname + "'")
			response.statusCode = 304;
			response.end();
		}
		else
		{
			log.i("handler.js", "200: '" + pathname + "'");
			response.setHeader("Content-Type", fileExtensionTypes[path.extname(pathname)]);
			response.statusCode = 200;
			response.setHeader("ETag", etag);
			var fileStream = fs.createReadStream("../client/" + type + "/" + pathname);
			fileStream.on("data", function(data) {
				response.write(data);
			});
			fileStream.on("end", function() {
				response.end();
			});
		}
	});
}

//exports.displayPage = displayPage;
//exports.displayCss = displayCss;
//exports.displayJs = displayJs;
exports.displayResource = displayResource;