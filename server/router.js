function route(handle, pathname, response, postData) {
	console.log("\033[34mRouter:\033[m About to route a request for " + pathname);
	if (typeof handle[pathname] === 'function') {
		return handle[pathname](response, postData);
	} else {
		console.log("\033[34mRouter:\033[m No request handler found for " + pathname);
		response.writeHead(404, {"Content-Type": "text/html"});
		response.write("404 Not Found");
		response.end();
	}
}

exports.route = route;