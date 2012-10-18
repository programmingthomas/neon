var exec = require("child_process").exec;
var fs = require("fs");

/*function start(response, postData) {
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
}*/

function displayPage(pathname, response, postData) {
	console.log("\033[32mHandle:\033[m Request handler '" + pathname + "' was called.");

	response.writeHead(200, {"Content-Type": "text/html"});

	if (pathname = "/") { 
		pathname = "/index"; 
	}

	fs.readFile("../client/html" + pathname + ".html", "utf8", function(err, data) {
		response.write(data);
		response.end();
	});
}

function css(response, postData) {
	console.log("\033[32mHandle:\033[m Request handler 'css' was called.");

	response.writeHead(200, {"Content-Type": "text/css"});

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
}

exports.displayPage = displayPage;
exports.css = css;
