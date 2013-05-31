//This JavaScript file contains all Neon JS functions that are essential for all areas
//of the webapp, such as changing page, doing authenticated AJAX requests and working
//with the API in a fluid and standardised way

//A simple extension to jQuery that adds a post JSON function for convenience
//http://forum.jquery.com/topic/getjson-using-post
jQuery.extend({
	postJSON: function(url, data, callback) {
		return jQuery.post(url, data, callback, "json");
	}
});

//To enable any form of navigation in IE10+
$(document).ready(function() {
   if ($.browser.msie) {
	   if (window.location.hash == "")
	   {
    	 NPS('');
	   }
   }
   if ("-ms-user-select" in document.documentElement.style && navigator.userAgent.match(/IEMobile\/10\.0/)) {
			var msViewportStyle = document.createElement("style");
			msViewportStyle.appendChild(
			document.createTextNode("@-ms-viewport{width:auto!important}"));
			document.getElementsByTagName("head")[0].appendChild(msViewportStyle);
	}
});

$(window).on('hashchange', function() {
  if ($.browser.msie) {
		NPS(window.location.hash.substring(1));
   }
});


//This function should be called once the page has finished loading
function NeonConfig(){
	window.onpopstate = function (event) {
		NeonOnPopState(window.location.hash.substring(1));
	};
	//Update required for Firefox
	NeonPopState(window.location.hash.substring(1));
	SetBackground();
}

//This function is called with the hash each time it changes, provided that the browser
//is modern. You do not need to call this function, because it handles the actual page
//change. Instead call NeonPopState(location) to change the page
function NeonOnPopState(hash) {
	//Interpret the hash and figure out which page needs showing
	if (!IsLoggedIn()) {
		ChangePage("welcome", "Welcome - Neon", function(np){
			//Configure login page
		});
	} else  {
		if (hash == "groups") {
			ChangePage("groups", "Groups - Neon", function(np) {
				ShowGroups();
				SetMenuHighlight("groups");
			});
		} else if (hash == "dashboard" || hash == "") {
			//Present the dashboard
			ChangePage("dashboard", "Dasboard - Neon", function(np){
				//Configure dashboard
				SetMenuHighlight("home");
				UpdateDashboard();
			});
		} else if (hash.indexOf("group-") == 0) {
			ChangePage("group", "Group - Neon", function(np) {
				SetMenuHighlight("groups");
				ShowGroup(hash.substring(6));
			});
		} else if (hash.indexOf("profile-") == 0) {
			ChangePage("profile", "Profile - Neon", function(np) {
				SetMenuHighlight("home");
				ShowProfile(hash.substring(8));
			});
		}else if (hash.indexOf("search") == 0) {
			//Search queries should be formed like this: #search=myquery
			ChangePage("search", "Search - Neon", function(np) {
				ShowSearch(hash.substring(7));
		});
		}else if (hash == "settings") {
			ChangePage("settings", "Settings - Neon", function(np) {
				ShowSettings();
			});
		}
	}
}

//Call this function when you want to change a page based on a link clicked or something
//similar. Perhaps add a jQuery class thing...
function NeonPopState(newPage) {
	history.pushState({page: newPage}, newPage, "#" + newPage);
	NeonOnPopState(newPage);
}

//Shortcut function to NeonPopState
function NPS(np) {
	NeonPopState(np);
}

//Requests a page and updates the DOM on the main page with the content
//before calling callback(newPage) if the change was successful
//newPage: the name of the new page, such as welcome, settings, profile or dashboard
//pageTitle: the title of the page that should be changed to
//callback: a function that takes an argument to indicate that the page has been moved
function ChangePage(newPage, pageTitle, callback) {
	$.get(newPage + "dom.html", {}, function(data, status, xhr) {
		if (status == "success") {
			$("#pagecontent").html(data);
			document.title = pageTitle;
			callback(newPage);
		}
	}, "html");
}

function SetMenuHighlight(newPage) {
	$("#homelink").removeClass("active");
	$("#groupslink").removeClass("active");
	$("#maillink").removeClass("active");
	$("#" + newPage + "link").addClass("active");
}

//Do an authenticated AJAX API request. If the server is unavailable or the request failed
//then it will call a function with the message from the API
//apiFunction: the bit that goes after /api/ such as dashboard or user/10
//dataToSend: a JavaScript object that will have the username/key added to it
//method: either post or get
//successCallback: a function that will be called with the Data object from the API
//failureCallback: a function that will be called with the failure message from the API
function APICall(apiFunction, dataToSend, method, successCallback, failureCallback) {
	var requestURL = AddressForAPIRequest(apiFunction);
	if (localStorage.username && localStorage.passkey) {
		dataToSend.username = localStorage.username;
		dataToSend.key = localStorage.passkey;
		GenericAPICall(requestURL, dataToSend, method, successCallback, failureCallback);
	} else {
		failureCallback("Not signed in")
	}
}

//This funciton is used by APICall, Login and Register so that you don't have to apply
//the username and password. You should not ever need to call this funciton
//requestURL: The full URL to request
//dataToSend: The full object of the data to send
//method: post or get
//successCallback: Called with the Data object of the API response if successful
//failureCallback: Called on network failure or data failure
function GenericAPICall(requestURL, dataToSend, method, successCallback, failureCallback) {
	//Generic callback function used for get/post requests
	var callback = function(data, status, xhr) {
		//Indicates that it did receive something from the server
		if (status == "success") {
			//Indicates that the response from the server is good
			if (data.SuccessCode == 200) {
				successCallback(data.Data);
			} else {
				failureCallback(data.Message)
			}
		} else {
			failureCallback("Server unavailable " + status)
		}
	};
	
	if (method == "post") {
		$.postJSON(requestURL, dataToSend, callback);
	} else if (method == "get") {
		$.getJSON(requestURL, dataToSend, callback);
	}
}

//Provides a boilerplate function that will present an alert if the API request fails
//You can use this if you don't want to provide your own
function fail(message) {
	alert(message);
}

//This returns the top level domain that the server is being hosted on so that the requests
//are handled correctly. Custom Neon Clients that aren't hosted on localhost should
//consider rewriting this function to match the domain properly
function TopLevelDomain() {
	return "http://" + document.location.hostname + ":" + document.location.port;
}

//Gets the address of the API request
function AddressForAPIRequest(apiRequestMethod) {
	return TopLevelDomain() + "/api/" + apiRequestMethod;
}

//Provides a generic Login function that will attempt to log the user in through the API
//username: The username to attempt a login with
//password: The password, which will be hashed server side
//successCallback: Function to call when there is a success
//failureCallback: Function to call in case of failure
function Login(username, password) {
	GenericAPICall(AddressForAPIRequest("login"), {username:username, password:password}, "post", function(d){
		localStorage.loggedIn = true;
		localStorage.username = d.Username;
		localStorage.passkey = d.KeyCode;
		NPS("dashboard");
	}, fail);
}

//Allows you to register a user through the API, works in the same way as the Login //function
//username: username to attempt registration with - must be lowercase letters
//password: a password (you ought to confirm that the user has entered it correctly twice)
//name: the real name of the user. Must just be letters and spaces (checked server side)
//successCallback and failureCallback work in the same way as normal API requests
function Register(username, password, name) {
	GenericAPICall(AddressForAPIRequest("register"), {username:username, password:password, name:name}, "post", function(d)
	{
		localStorage.loggedIn = true;
		localStorage.username = d.Username;
		localStorage.passkey = d.KeyCode;
		NPS("dashboard");
	}, fail);
}

//This will do all the logout stuff that you need to ensure that the user can log out
//and that the keys on the server side are invalidated. This will then redirect the user
//to the login/registration/welcome page
function Logout() {
	APICall("logout", {}, "get", function (d){
		localStorage.username = "";
		localStorage.passkey = "";
		localStorage.splash = "";
		localStorage.loggedIn = false;
		ChangePage("welcome", "Neon", function(np){
			SetMenuHighlight("home");
		});
	}, fail);
}

//This will confirm whether or not the user is signed in by examining the username in 
//localStorage
function IsLoggedIn() {
	//Local Storage seems to store everything as a string, regardless!
	if (localStorage.loggedIn == "false" || localStorage.loggedIn == "undefined" || localStorage.loggedIn == "null" || localStorage.loggedIn == undefined || localStorage.loggedIn == null) {
		return false;
	}
	return true;
}

//This function will set the background to either whatever is stored in 
//localStorage.splash or a random background from the ones that we selected
function SetBackground() {
	var splash = localStorage.splash;
	
	if (splash == "null" || splash == null || splash == "" || splash == undefined || splash == "undefined"  ) {
		var splashes = ["cornfield", "hills", "island", "sea", "sunset", "sun", "yellowstone"];
		splash = splashes[Math.floor(Math.random() * splashes.length)];
	}
	SetBackgroundWithSplash(splash)
}

//This is used by SetBackground to actually set the background and detect the size of the
//window.
//splash: a splash image to use; one of cornfield, hills, island, sea, sunset, sun or 
//yellostone
function SetBackgroundWithSplash(splash) {
	var widths = [600, 768, 979, 1280, 1366, 1440, 1680, 1920, 3000];
	var body_width = $("body").width();

	if (body_width > widths[widths.length - 1]) { //too big
		var image_width = width[widths.length - 1];
	} else if (body_width < widths[0]) { //too small
		var image_width = widths[0];
	} else { //juuust right
		var image_width = roundUpWidth(widths, body_width)[1];
	}

	$("#fixedbg").css("background-image", "url('splashes/" + splash + "/" + image_width + ".jpg')");
}

//Determines whether or not a certain width is acceptable
function roundUpWidth(a, x) {
	var lo, hi;
	for (var i = a.length; i--;) {
		if (a[i] <= x && (lo === undefined || lo < a[i])) lo = a[i];
		if (a[i] >= x && (hi === undefined || hi > a[i])) hi = a[i];
	};
	return [lo, hi];
}

//Do an API request to the dashboard so that it can be updated, relies on the dashboard
//DOM being visible. Perhaps some sort of caching would also be good to add at some point
//for faster loading times
function UpdateDashboard() {
	APICall("dashboard", {},"get", function(data) {
		document.title = "Dashboard - Neon";
		$("#dashrealname").text(data.User.Name);
		$("#dashusername").text("@" + data.User.Username);
		$('#profileLink').attr("href", "#profile-" + data.User.Username);
		document.getElementById("dashuserimage")
			.src = data.User.UserImage;
		var dashPosts = document.getElementById("dashposts");
		dashPosts.innerHTML = "";
		for (var i = 0; i < data.Posts.length; i++) {
			var post = data.Posts[i];
			var html = HTMLForPost(post);
			dashPosts.innerHTML += html;
			if (i != data.Posts.length - 1) dashPosts.innerHTML += "<hr />";
		}

		var groupEntry = document.getElementById("postgroup");
		groupEntry.innerHTML = ""
		for (var i = 0; i < data.User.GroupIDs.length; i++) {
			groupEntry.innerHTML += "<option value=\"" + data.User.GroupIDs[i] + "\">" + data.User.GroupNames[i] + "</option>";
		}

		SetMenuHighlight("home");
		localStorage.splash = data.User.Background;
	}, fail);
}

//Generates the HTML layout for a post (the Markdown and whatnot is parsed by the server)
function HTMLForPost(post) {
	var groupLink = post.GroupID.toString();
	var profileLink = post.UserID.toString();
	return "<section class=\"post row\" id=\"post" + post.PostID + "\">" + "<div class=\"span1\"><img src=\"" + post.UserImage + "\" id=\"postUserImage\" /></div>" + "<div class=\"span7\">" + "<h4 style=\"margin:0;padding:0;\"> <a href=\"#profile-" + profileLink + "\">" + post.UserFullName + "</a><span style=\"color:grey\"> &#9658 <a href=\"#group-" + groupLink + "\">" + post.GroupName + "</a></span></h4>" + post.HTML + "<p style=\"font-size:smaller;color:#777;\">" + post.TimeDescription + " &#8226 <a href=\"#\">" + post.Likes + " Likes</a> &#8226 " + "<a href=\"#\">" + post.Dislikes + " dislikes</a></p></div></section>";
}

//Gets the detail for a group including all the posts and some of the members before
//presenting it
//groupId: The ID (number) of a group
function ShowGroup(groupId) {
	APICall("group/" + groupId, {}, "get", function(data){
		$("#groupname").text(data.GroupName);
		$("#groupauthor").text("Group created by " + data.GroupCreatorName);
		$("#groupjoin").click(function() {
			APICall("group/join", {group:groupId}, "post", function(d){
				ShowGroup(groupId);
			});
		});
		var html = "";
		for (var i = 0; i < data.Posts.length; i++) {
			html += HTMLForPost(data.Posts[i]);
		}
		$("#groupcontent").html(html);

		var members = "";

		for (var i = 0; i < data.MemberImages.length; i++) {
			members += "<img src=\"" + data.MemberImages[i] + "\" />";
		}
		$("#groupmembers").html(members);
	}, fail);
}


//Presents the profile in the profile page (should be visible)
//profile: a username (string) or id (number)
function ShowProfile(profile) {
	APICall("user/" + profile, {}, "get", function(data){
		document.title = (data.Username + " - Neon");
		$("#username").text("@" + data.Username);
		$("#name")
			.text(data.Name);
		$("#profilePicture")
			.attr("src", (data.UserImage));

		var html = "";
		for (var i = 0; i < data.Posts.length; i++) {
			html += HTMLForPost(data.Posts[i]);
		}
		$("#usercontent").html(html);
	}, fail);
}

//Shows all the groups that a user is a member of
function ShowGroups() {
	APICall("group/mine", {}, "get", function(data) {
		var html = "<ul>"
		for (var i = 0; i < data.length; i++) {
			html += "<li><a href=\"#group-" + data[i].GroupID + "\">" + data[i].GroupName + "</a> <span class=\"label " + (data[i].MyRole == 1 ? "label-success" : "") + "\">" + (data[i].MyRole == 1 ? "Staff" : "Member") + "</span></li>";
		}
		html += "</ul>"
		$("#grouplist").html(html);
	}, fail);
}

//Sets up the search query page. To load the search page: #search=query 
function ShowSearch(query) {
	$("#searchquery").text("Showing results for: '" + query + "'");
	//There is div #searchcontent which should contain all relevant search results.
}

//Fetchs the details of the current user and presents them in the settings pane so that
//they can be modified at will
function ShowSettings() {
	APICall("user", {}, "get", function (data) {
		$("#txtName").val(data.Name);
		$("#txtUsername").val(data.Username);
		$("#profilePicture").attr("src",(data.UserImage));
		
		var splashes = ["cornfield", "hills", "island", "sea", "sunset", "sun", "yellowstone"];
		var html = "<ul class=\"thumbnails\">";
		for (var i = 0; i < splashes.length; i++) {
			var splash = splashes[i];
			html += "<li><div class=\"thumbnail\"><img id=\""+ splash +"\" class=\"backgroundPicture\" src=\"/splashes/"+ splash +"/300.jpg\"/></div></li>";
		}
		html += "</ul>";
		$("#backgrounds").html(html);
	}, fail);
}

//Creates a new group and then shows the groups page again
//n: The name of a group (must be unique, letters and spaces only)
function CreateGroup(n) {
	APICall("group/create", "post", {name:n}, function(data){
		ShowGroups();
	});
}

//Fetches a list of all the groups and presents them in the dialog
function ShowAllGroups() {
	APICall("group/all", {}, "get", function(data){
		var html = "<ul>";
		for (var i = 0; i < data.length; i++) {
			html += "<li><a href=\"#group-" + data[i].GroupID + "\">" + data[i].GroupName + "</a></li>";
		}
		$("#groupListContent").html(html)
	}, fail);
}

//Put a post into a certain group and update the dashboard.
//content: The content (string) to be posted on the server
//group: The ID of a group to post into
function Post(content, group) {
	APICall("post", {group:group, content:content}, "post", function(data){
		UpdateDashboard();
	}, fail)
}

//Final function in the file to launch the first one when the page has loaded
$(document).ready(NeonConfig);