var fs = require("fs");
var requestHandlers = require("./handler");

function route(handle, pathname, response, postData) {
	console.log("\033[34mRouter:\033[m About to route a request for " + pathname);
	
	if (pathname = "/") { pathname = "/index"; }

	fs.exists('../client/html' + pathname + '.html', function() {
		console.log("exists?");
		return requestHandlers.displayPage(pathname, response, postData);

	}); 



/*	else {
		console.log("\033[34mRouter:\033[m File /client/html" + pathname + ".html not found on the server.");
		response.writeHead(404, {"Content-Type": "text/html"});
		response.write("404 Not Found");
		response.end();
	} */
}

exports.route = route;