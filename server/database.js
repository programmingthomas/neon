//database.js manages the model layer of the service
//This means that it loads up the JS at runtime and saves it periodically
var log = require("./logger");
var fs = require("fs");
var config = require("./config");

//The first row represent the various stores/tables/collections
var users, keys, groups, members, posts, reposts, likes, messages;

//The second row is arrays for indexes so that you don't have to search through
var uI, kI, gI, mI, pI, rI, lI, eI;

//--------------------
//DATA STORE FUNCTIONS
//--------------------

//I call this rather than just running code because I haven't decided whether or not I'm going to keep database.js doing this
createOrLoad();

function createOrLoad()
{
	//Complex stuff man
	loadTo("users");
	loadTo("keys");
	loadTo("groups");
	loadTo("members");
	loadTo("posts");
	loadTo("reposts");
	loadTo("likes");
	loadTo("messages");
}

//This function will read the file and send the data off for processing
function loadTo(filename)
{
	fs.exists(filename + config.storeExtension, function(exists)
	{
		//If the file exists it can be sent to the gotData function
		if (exists)
		{
			//I add .jsondb - this is specified in config.js
			fs.readFile(filename + config.storeExtension, "utf8", function(err, data)
			{
				if (!err)
				{
					//Send data off because processed correctly
					gotData(JSON.parse(data), filename);
					log.i("database.js", "Loaded " + filename);
				}
				else log.e("database.js", err);
			});
		}
		else
		{
			//Create the default data object
			log.i("database.js", "Creating " + filename + config.storeExtension);
			var objToModify = {};
			objToModify.index = 1;
			objToModify.table = [];
			//Tell gotData that data is now available
			gotData(objToModify, filename);
			//Push to file for back up
			saveTo(objToModify, filename);
		}
	});
}

//This function loads the data into the variable
function gotData(data, name)
{
	if (name == "users")
	{
		users = data;
		//This is called when indexes NEED to be loaded
		loadUserIndexes();
	}
	else if (name == "keys")
	{
		keys = data;
		//There are now indexes, therefore key IDs are not required
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


function saveTo(objToSave, filename)
{
	//Log
	log.i("database.js", "Saving " + filename + config.storeExtension);
	//Stringify and save to file. I might add compression at a later date
	fs.writeFile(filename + config.storeExtension, JSON.stringify(objToSave));
}

function loadUserIndexes()
{
	//Re-instantiate
	uI = new Array();
	//Loop through and set values
	for (var i = 0; i < users.table.length; i++) uI[users.table[i].id] = i;
	//Done everything, users now available
	exports.users = users;
}

function loadPostIndexes()
{
	pI = new Array();
	for (var i = 0; i < posts.table.length; i++) pI[posts.table[i].id] = i;
	exports.posts = posts;
}

function loadGroupIndexes()
{
	gI = new Array();
	for (var i = 0; i < groups.table.length; i++) gI[groups.table[i].id] = i;
	exports.groups = groups;
}

//---------------------
//DATA HELPER FUNCTIONS
//---------------------

function userForId(id)
{
	var user = users.table[uI[id]];
	if (user != undefined && user.id == id) return user;
	else return null;
}

function groupForId(id)
{
	var group = groups.table[gI[id]];
	if (group != undefined && group.id == id) return group;
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
	//If no user is found null is returned
	return user;
}

function postForId(id)
{
	var post = posts.table[pI[id]];
	//Simple confirmation checks
	if (post != undefined && post.id == id) return post;
	else return null;
}

//Finally, export all the functions that the API may need to access
exports.saveTo = saveTo;
exports.userForId = userForId;
exports.userForName = userForName;
exports.groupForId = groupForId;
exports.loadUserIndexes = loadUserIndexes;
exports.loadGroupIndexes = loadGroupIndexes;
exports.loadPostIndexes = loadPostIndexes;
exports.postForId = postForId;