var fs = require("fs");
var requestHandlers = require("./handler");
var path = require("path");
var log = require("./logger");

function route(pathname, response, postData) {

	if (pathname === "") {
		pathname = "index.html";
	}

	log.i("router.js", "About to route a request for " + pathname);

	if(path.extname(pathname) === ".html") {
		fs.exists('../client/html/' + pathname, function(exists) {
			if (exists) {
				return requestHandlers.displayPage(pathname, response, postData);
			}
			else {
				log.e("router.js", "File /client/html/" + pathname + ".html not found on the server.");
				response.writeHead(404, {"Content-Type": "text/html"});
				response.write("404 Not Found");
				response.end();
			}
		}); 
	}

	else if(path.extname(pathname) === ".css") {
		fs.exists('../client/css/' + pathname, function(exists) {
			if (exists) {
				return requestHandlers.displayCss(pathname, response, postData);
			}
			else {
				log.e("router.js", "File /client/css/" + pathname + ".css not found on the server.");
				response.end();
			}
		}); 
	}

	else if(path.extname(pathname) === ".js") {
		fs.exists('../client/js/' + pathname, function(exists) {
			if (exists) {
				return requestHandlers.displayJs(pathname, response, postData);
			}
			else {
				log.e("router.js", "File /client/js/" + pathname + ".js not found on the server.");
				response.end();
			}
		}); 
	}
	else
	{
		log.e("router.js", "Could not route a request for " + pathname);
		response.writeHead(404, {"Content-Type": "text/html"});
		response.write("404 Not Found");
	}

}
exports.route = route;