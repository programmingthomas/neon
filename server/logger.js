//This is a really simple logging feature that logs to log.txt (server folder)
//If you don't have a log.txt create one with this as the first line:
//Timestamp	Type	Source	Message

var fs = require("fs");

//Logger

function log(color, source, message)
{
	console.log(color + source + ":\033[0m\t" + message);
	fs.open("log.txt", "a", 666, function(e, id)
	{
		var kind = "Information";
		if (color == '\033[93m') kind = "Warning";
		else if (color == '\033[91m') kind = "Error"
		fs.write(id, "\n" + prettyDate() + "\t" + kind + "\t" + source + "\t" + message, null, "utf8", function()
		{
			fs.close(id, function(){});
		});
	});
}

//Warning function
function w(source, message)
{
	log('\033[93m', source, message);
}

//Error function
function e(source, message)
{
	log('\033[91m', source, message)
}

//Information function
function i(source, message)
{
	log('\033[92m', source, message);
}

//Gets pretty date string
function prettyDate()
{
	return new Date().toString();
	//var date = Date.now();
	//return date.getFullYear().toString() + "-" + (date.getMonth() + 1).toString() + "-" + date.getDate().toString() + " " + date.getHours().toString() + ":" + date.getMinutes().toString() + ":" + date.getSeconds().toString() + " " + date.getTimezoneOffset().toString();
}

//Export the functions
exports.log = log;
exports.w = w;
exports.e = e;
exports.i = i;