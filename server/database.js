var log = require("./logger");
var fs = require("fs");

var users, keys, groups, members, posts, reposts, likes, messages;

createOrLoad();

function createOrLoad()
{
	loadTo("users");
	loadTo("keys");
	loadTo("groups");
	loadTo("members");
	loadTo("posts");
	loadTo("reposts");
	loadTo("likes");
	loadTo("messages");
}

function loadTo(filename)
{
	fs.exists(filename + ".jsondb", function(exists)
	{
		if (exists)
		{
			fs.readFile(filename + ".jsondb", "utf8", function(err, data)
			{
				if (!err)
				{
					gotData(JSON.parse(data), filename);
					log.i("database.js", "Loaded " + filename);
				}
				else log.e("database.js", err);
			});
		}
		else
		{
			log.i("database.js", "Creating " + filename);
			var objToModify = {};
			objToModify.index = 0;
			objToModify.table = [];
			gotData(objToModify, filename);
			saveTo(objToModify, filename);
		}
	});
}

function gotData(data, name)
{
	if (name == "users")
	{
		users = data;
		exports.users = users;
	}
	else if (name == "keys")
	{
		keys = data;
		exports.keys = keys;
	}
	else if (name == "members") 
	{
		members = data;
		exports.members = members;
	}
	else if (name == "posts") 
	{
		posts = data;
		exports.posts = posts;
	}
	else if (name == "reposts")
	{
		reposts = data;
		exports.reposts = reposts;
	}
	else if (name == "likes")
	{
		likes = data;
		exports.likes = likes;
	}
	else if (name == "messages") 
	{
		messages = data;
		exports.messages = messages;
	}
}

function saveTo(objToSave, filename)
{
	fs.writeFile(filename + ".jsondb", JSON.stringify(objToSave));
}

exports.saveTo = saveTo;