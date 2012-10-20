var fs = require("fs");
var requestHandlers = require("./handler");
var path = require("path");
var log = require("./logger");

function route(pathname, response, postData) {

	if (pathname === "") {
		pathname = "index.html";
	}

	var folderPath = path.dirname(pathname).toString().split("/");
	var folder = folderPath[folderPath.length - 1];

	var fileName = path.basename(pathname);

	if(path.extname(pathname) === ".html") {
		fs.exists('../client/html/' + fileName, function(exists) {
			if (exists) {
				return requestHandlers.displayPage(fileName, response, postData);
			}
			else {
				log.e("router.js", "File /client/html/" + fileName + " not found on the server.");
				response.writeHead(404, {"Content-Type": "text/html"});
				response.write("404 Not Found");
				response.end();
			}
		}); 
	}

	else if(path.extname(pathname) === ".css") {
		fs.exists('../client/css/' + fileName, function(exists) {
			if (exists) {
				return requestHandlers.displayCss(fileName, response, postData);
			}
			else {
				log.e("router.js", "File /client/css/" + fileName + " not found on the server.");
				response.end();
			}
		}); 
	}

	else if(path.extname(pathname) === ".js") {
		fs.exists('../client/js/' + fileName, function(exists) {
			if (exists) {
				return requestHandlers.displayJs(fileName, response, postData);
			}
			else {
				log.e("router.js", "File /client/js/" + fileName + " not found on the server.");
				response.end();
			}
		}); 
	}

	else
	{
		fs.exists("../client/" + folder + "/" + fileName, function(exists) {
			if (exists) {
				return requestHandlers.displayResource(folder, fileName, response, postData);
			}
			else {
				log.e("router.js", "File " + path.basename(pathname) + " not found on the server.");
				log.e("router.js", "Could not route a request for " + pathname);
				response.writeHead(404, {"Content-Type": "text/html"});
				response.write("404 Not Found");
				response.end();
			}
		});
		
	}

}
exports.route = route;