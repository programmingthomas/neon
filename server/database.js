var log = require("./logger");
var fs = require("fs");

var users, keys, groups, members, posts, reposts, likes, messages;
var uI, kI, gI, mI, pI, rI, lI, eI;

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
			objToModify.index = 1;
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
		loadUserIndexes();
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
	else if (name == "groups")
	{
		groups = data;
		loadGroupIndexes();
	}
	else if (name == "posts")
	{
		posts = data;
		loadPostIndexes();
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

function loadUserIndexes()
{
	uI = new Array();
	for (var i = 0; i < users.index; i++) uI[i] = 0;
	for (var i = 0; i < users.table.length; i++) uI[users.table[i].id] = i;
	exports.users = users;
}

function loadPostIndexes()
{
	pI = new Array();
	for (var i = 0; i < posts.index; i++) pI[i] = 0;
	for (var i = 0; i < posts.table.length; i++) pI[posts.table[i].id] = i;
	exports.posts = posts;
}

function loadGroupIndexes()
{
	gI = new Array();
	for (var i = 0; i < groups.index; i++) gI[i] = 0;
	for (var i = 0; i < groups.table.length; i++) gI[groups.table[i].id] = i;
	exports.groups = groups;
}

function userForId(id)
{
	log.i("database.js", "Loading data for user #" + id.toString());
	log.i("database.js", "Array index for #" + id.toString() + " is " + uI[id]);
	var user = users.table[uI[id]];
	if (user != undefined && user.id == id) return user;
	else return null;
}

function groupForId(id)
{
	var group = groups.table[gI[id]];
	if (group.id == id) return group;
	else return null;
}

function userForName(username)
{
	var user;
	for (var i = 0; i < users.table.length; i++)
	{
		if (users.table[i].username == username)
		{
			user = users.table[i];
			break;
		}
	}
	return user;
}

function saveTo(objToSave, filename)
{
	log.i("database.js", "Saving " + filename);
	fs.writeFile(filename + ".jsondb", JSON.stringify(objToSave));
}

exports.saveTo = saveTo;
exports.userForId = userForId;
exports.userForName = userForName;
exports.groupForId = groupForId;
exports.loadUserIndexes = loadUserIndexes;
exports.loadGroupIndexes = loadGroupIndexes;
exports.loadPostIndexes = loadPostIndexes;