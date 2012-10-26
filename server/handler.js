var exec = require("child_process").exec;
var fs = require("fs");
var path = require("path");
var config = require("./config");
var log = require("./logger");

//IF YOU NEED TO SERVER UP A DIFFERENT KIND OF FILE PLEASE ADD THE EXTENSION AND MIME TYPE HERE
var fileExtensionTypes = [];
fileExtensionTypes[".html"] = "text/html";
fileExtensionTypes[".css"] = "text/css";
fileExtensionTypes[".js"] = "text/javascript";
fileExtensionTypes[".svg"] = "image/svg+xml";
fileExtensionTypes[".ttf"] = "application/x-font-ttf";
fileExtensionTypes[".woff"] = "application/x-font-woff";

//This function allows you to return a resource
//In the future I plan on refactoring this so that key files such as the CSS, index and JS are loaded and kept in RAM
//This means they may be more rapidly servered in the future
function displayResource(type, pathname, request, response, postData)
{
	//fs.stat allows me to determine size and last modified time
	//This is code was copied from somewhere else so that the client caches the files...
	fs.stat("../client/" + type + "/" + pathname, function(err, stat) {
		var etag = etag = stat.size + '-' + Date.parse(stat.mtime);
		response.setHeader("Last-Modified", stat.mtime);
		if (request.headers['if-none-match'] === etag && config.cache)
		{
			//This will just send a 304 back
			log.i("handler.js", "304: '" + pathname + "'")
			response.statusCode = 304;
			response.end();
		}
		else
		{
			//Handle a 200
			log.i("handler.js", "200: '" + pathname + "'");
			response.setHeader("Content-Type", fileExtensionTypes[path.extname(pathname)]);
			response.statusCode = 200;
			response.setHeader("ETag", etag);
			
			//Create a read buffer
			var fileStream = fs.createReadStream("../client/" + type + "/" + pathname);
			
			//When data is received, write it to the response
			fileStream.on("data", function(data) {
				response.write(data);
			});

			//Finish up and send to client
			fileStream.on("end", function() {
				response.end();
			});
		}
	});
}

exports.displayResource = displayResource;