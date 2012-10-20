var exec = require("child_process").exec;
var fs = require("fs");
var log = require("./logger");
var path = require("path");

var fileExtensionTypes = [];
fileExtensionTypes[".html"] = "text/html";
fileExtensionTypes[".css"] = "text/css";
fileExtensionTypes[".js"] = "text/javascript";
fileExtensionTypes[".svg"] = "image/svg+xml";
fileExtensionTypes[".ttf"] = "application/x-font-ttf";
fileExtensionTypes[".woff"] = "application/x-font-woff";

function displayPage(pathname, response, postData) {

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
}

function displayResource(type, pathname, response, postData)
{
	log.i("handler.js", "Returning resource for '" + pathname + "'");
	response.writeHead(200, {"Content-Type": mimeForFile(path.extname(pathname)) });
	var fileStream = fs.createReadStream("../client/" + type + "/" + pathname);
	fileStream.on("data", function(data) {
		response.write(data);
	});
	fileStream.on("end", function() {
		response.end();
	})
}

function mimeForFile(extension)
{
	return fileExtensionTypes[extension];
}

/*function css(response, postData) {

	var cssFiles = ["../client/css/css.css"];

	var totalCSS = ""

	var cssCount = 0;

	for (var i = 0; i < cssFiles.length; i++)
	{
		fs.readFile(cssFiles[i], "utf8", function(err, data) {
			console.log("Read " + cssFiles[i]);
			totalCSS += data;
			cssCount += 1;
			if (cssCount >= cssFiles.length)
			{
				response.write(totalCSS);
				response.end();	
			}
		});
	}
}*/

exports.displayPage = displayPage;
exports.displayCss = displayCss;
exports.displayJs = displayJs;
exports.displayResource = displayResource;