var fs = require("fs");
var path = require("path");
var requestHandlers = require("./handler");
var log = require("./logger");
var api = require("./api");

function route(pathname, request, response, parameters) {

	if (pathname === "") {
		pathname = "index.html";
	}

	//If it is an API request, route it the API rather than the serving up a file
	if (api.isApiRequest(pathname)) api.runApi(request, response, parameters);
	else
	{

		var folderPath = path.dirname(pathname).toString().split("/");
		var folder = folderPath[folderPath.length - 1];

		var fileName = path.basename(pathname);
		if (path.extname(pathname) === ".html") folder = "html";
		if (path.extname(pathname) === ".js") folder = "js";
		if (path.extname(pathname) === ".css") folder = "css";

		fs.exists("../client/" + folder + "/" + fileName, function(exists) {
			if (exists) {
				return requestHandlers.displayResource(folder, fileName, request, response, parameters);
			}
			else {
				log.e("router.js", "404: '" + path.basename(pathname) + "'");
				response.writeHead(404, {"Content-Type": "text/html"});
				response.write("404 Not Found");
				response.end();
			}
		});
	}	

}
exports.route = route;