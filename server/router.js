var fs = require("fs");
var requestHandlers = require("./handler");
var path = require("path");
var log = require("./logger");
var api = require("./api");

function route(pathname, request, response, parameters) {

	if (pathname === "") {
		pathname = "index.html";
	}

	if (api.isApiRequest(pathname)) api.runApi(request, response, parameters);
	else
	{

		var folderPath = path.dirname(pathname).toString().split("/");
		var folder = folderPath[folderPath.length - 1];

		var fileName = path.basename(pathname);

		if(path.extname(pathname) === ".html") {
			fs.exists('../client/html/' + fileName, function(exists) {
				if (exists) {
					return requestHandlers.displayResource("html", fileName, response, parameters);
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
					return requestHandlers.displayResource("css", fileName, response, parameters);
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
					return requestHandlers.displayResource("js", fileName, response, parameters);
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
					return requestHandlers.displayResource(folder, fileName, response, parameters);
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

}
exports.route = route;