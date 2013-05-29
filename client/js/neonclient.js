/*
This file is the general client side JS bridge
It can return stuff. It's pretty useful
It does /api/ calls as documented on the wiki
All functions in this file are prefixed with nc_
*/

/*
A simple extension to jQuery that adds a post JSON function for convenience
http://forum.jquery.com/topic/getjson-using-post
*/

jQuery.extend({
	postJSON: function(url, data, callback) {
		return jQuery.post(url, data, callback, "json");
	}
});

var loaded = false;

$(document).ready(function() {
	if (!loaded) {
		setBackground();
		loaded = true;
		console.log(window.location.hash);
		if (localStorage.username != undefined && localStorage.passkey != undefined && localStorage.username != null && localStorage.passkey != null && localStorage.username != "null" && localStorage.passkey != "null") {
			if (window.location.hash == "" || window.location.hash == "#home")
				changeToDashboard();
			else if (window.location.hash == "#groups")
				showGroups();
			else if (window.location.hash.indexOf("#group-") == 0)
				showGroup(window.location.hash);
		} else {
			$.get("welcomedom.html", {}, function(data, status, xhr) {
				$("#pagecontent").html(data);
			}, "html");
		}
		
		if ("-ms-user-select" in document.documentElement.style && navigator.userAgent.match(/IEMobile\/10\.0/))
		{
			var msViewportStyle = document.createElement("style");
			msViewportStyle.appendChild(
				document.createTextNode("@-ms-viewport{width:auto!important}")
			);
			document.getElementsByTagName("head")[0].appendChild(msViewportStyle);	
		}
	}
});



function nc_login(u, p) 
{
	$.getJSON("/api/login/", {username:u, password:p}, function(data, status, xhr) 
	{
		loginAttemptApproved(data)
	});
}

function nc_register(u, p, r)
{
	$.postJSON("/api/register/", {username:u, password:p, name:r}, function(data, status, xhr)
	{
		loginAttemptApproved(data)
	});
}

function loginAttemptApproved(data)
{
	if (data.SuccessCode == 200)
	{
		localStorage.username = data.Data.Username;
		//localStorage.key is a function, so I went for passkey instead
		localStorage.passkey = data.Data.KeyCode;
		changeToDashboard();
	}
	else
	{
		$(".loginsignuperror").text(data.Message);
	}
}


function nc_post(u, k, g, c) 
{
	var html = "<section class='nc_post'>";	
	$.getJSON("/api/post/", {username:u, key:k, group:g, content:c}, function(data, status, xhr) 
	{
		updateDashboard();
	});
}

function changeToDashboard()
{
	$("#welcomebox").fadeOut(500);
	$.get("dashboarddom.html", {}, function(data, status, xhr){
		$("#pagecontent").html(data);
		updateDashboard();
	}, "html");
}

function updateDashboard()
{
	$.getJSON("/api/dashboard", {username:localStorage.username, key:localStorage.passkey}, function (data, status, xhr)
	{
		document.title = "Dashboard - Neon";
		$("#dashrealname").text(data.Data.User.Name);
		$("#dashusername").text("@" + data.Data.User.Username);
		document.getElementById("dashuserimage").src = data.Data.User.UserImage;
		var dashPosts = document.getElementById("dashposts");
		dashPosts.innerHTML = "";
		for (var i = 0; i < data.Data.Posts.length; i++)
		{
			var post = data.Data.Posts[i];
			var html = HTMLForPost(post);
			dashPosts.innerHTML += html;
			if (i != data.Data.Posts.length - 1) dashPosts.innerHTML += "<hr />";
		}
		
		var groupEntry = document.getElementById("postgroup");
		groupEntry.innerHTML = ""
		for (var i = 0; i < data.Data.User.GroupIDs.length; i++) {
			groupEntry.innerHTML += "<option value=\"" + data.Data.User.GroupIDs[i] + "\">" + data.Data.User.GroupNames[i] + "</option>";
		}
		
		changeMenuHighlight("home");
	});
}

function HTMLForPost(post)
{
	return "<section class=\"post row\" id=\"post" + post.PostID + "\">" +
			"<div class=\"span1\"><img src=\"" + post.UserImage + "\" style=\"max-width:50px; max-height:50px\" /></div>" +
			"<div class=\"span7\">" +
			"<h4 style=\"margin:0;padding:0;\">" + post.UserFullName + "<span style=\"color:grey\"> &#9658 " + post.GroupName + "</span></h4>" + post.HTML + 
			"<p style=\"font-size:smaller;color:#777;\">" + post.TimeDescription + " &#8226 <a href=\"#\">" + post.Likes + " Likes</a> &#8226 " + 
			"<a href=\"#\">" + post.Dislikes + " dislikes</a></p></div></section>";
}

function logout()
{
	localStorage.passkey = null;
	localStorage.username = null;
	$.get("welcomedom.html", {}, function(data, status, xhr){
		$("#pagecontent").html(data);
		changeMenuHighlight("home");
		document.title = "Neon";
	}, "html");
}

function changeMenuHighlight(newpage) {
	$("#homelink").removeClass("active");
	$("#groupslink").removeClass("active");
	$("#maillink").removeClass("active");
	$("#" + newpage + "link").addClass("active");
}

function showGroups() {
	$.get("groupsdom.html", {}, function(data, status, xhr){
		document.title = "Groups - Neon";
		$("#pagecontent").html(data);
		$.getJSON("/api/group/mine", {username:localStorage.username, key:localStorage.passkey}, function(data, status, xhr){
			var html = "<ul>"
			for (var i = 0; i < data.Data.length; i++)
			{
				html += "<li><a class=\"grouplink\" href=\"#group-" + data.Data[i].GroupID + "\">" + data.Data[i].GroupName + "</a> <span class=\"label " + (data.Data[i].MyRole == 1 ? "label-success" : "") + "\">" + (data.Data[i].MyRole == 1 ? "Staff" : "Member") + "</span></li>";
			}
			html += "</ul>"
			$("#grouplist").html(html);
			addGroupLink();
		});
		changeMenuHighlight("groups");
	}, "html");
}

function nc_creategroup(n)
{
	$.postJSON("/api/group/create", {username:localStorage.username, key:localStorage.passkey, name:n}, function(data, status, xhr) {
		showGroups();
	});
}

function showAllGroups() {
	$.getJSON("/api/group/all", {username:localStorage.username, key:localStorage.passkey}, function(data, status, xhr) {
		var html = "<ul>";
		for (var i = 0; i < data.Data.length; i++)
		{
			html += "<li><a class=\"grouplink\" href=\"#group-" + data.Data[i].GroupID + "\">" + data.Data[i].GroupName + "</a></li>";
		}
		$("#groupListContent").html(html);
		addGroupLink();
	});
}

function showGroup(hash)
{
	var g = hash.replace("#group-", "")
	$.get('groupdom.html', {}, function(data, textStatus, xhr) {
		$("#pagecontent").html(data);
		$.getJSON("/api/group/" + g, {username:localStorage.username, key:localStorage.passkey}, function(data, status, xhr){
			$("#groupname").text(data.Data.GroupName);
			$("#groupauthor").text("Group created by " + data.Data.GroupCreatorName);
			$("#groupjoin").click(function()
			{
				$.postJSON("/api/group/join", {username:localStorage.username, key:localStorage.passkey, group:g}, function(data, status, xhr){
					showGroup("#group-" + g);
				});
			});
			var html = "";
			for (var i = 0; i < data.Data.Posts.length; i++)
			{
				html += HTMLForPost(data.Data.Posts[i]);
			}
			$("#groupcontent").html(html);
			
			var members = "";
			
			for (var i = 0; i < data.Data.MemberImages.length; i++)
			{
				members += "<img src=\"" + data.Data.MemberImages[i] + "\" />";
			}
			$("#groupmembers").html(members);
		});
		changeMenuHighlight("groups");
	}, "html");
}

function addGroupLink()
{
	$(".grouplink").click(groupLinkClicked);
}

function groupLinkClicked()
{
	showGroup($(this).attr("href"));
}