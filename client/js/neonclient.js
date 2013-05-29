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

function nc_user(u, k, q, o) 
{
	var html = "<section class='nc_user'>";

	$.getJSON("/api/user/" + q, {username:u, key:k, offset:o}, function(data, status, xhr) 
	{
			html += "<article>";

			html += "<span class='nc_user_id'>" + data.user.id.toString() + "</span>";
			html += "<span class='nc_user_username'>" + data.user.username + "</span>";			
			html += "<span class='nc_user_name'>" + data.user.name.toString() + "</span>";		
			html += "<img src='" + data.user.userImage + "' class='nc_user_userImage'></img>";

			html += "<ul class='nc_user_posts'>";
			for (var n = 0; n < data.user.posts.length; n++)
			{
				html += ("<li>" + data.user.posts[n].html + "</li>");
			}
			html += ("</ul>");

			html += ("<ul class='nc_user_groups'>");
			for (var n = 0; n < data.user.groups.length; n++)
			{
				html += ("<li>" + data.user.groups[n].html + "</li>");
			}
			html += ("</ul>");

			html += ("</article>");

			html += ("</section>");
			displayData(html);
	});
}

function displayData(h)
{
	console.log(h);
}

function nc_group(u, k, q, o) 
{
	var html = "<section class='nc_group'>";

	$.getJSON("/api/group/" + q, {username:u, key:k, offset:o}, function(data, status, xhr) 
	{
			html += "<article>";

			html += ("<span class='nc_group_id'>" + data.group.groupId.toString() + "</span>");
			html += ("<span class='nc_group_groupname'>" + data.group.groupName + "</span>");	

			html += ("<ul class='nc_group_groupcreator'>");
			for (var n = 0; n < data.group.groupCreator.length; n++)
			{
				html += ("<li>" + data.user.groupCreator[n].html + "</li>");
			}
			html += ("</ul>");

			html += ("<span class='nc_group_groupcolor'>" + data.group.groupColor + "</span>");		

			html += ("<ul class='nc_group_posts'>");
			for (var n = 0; n < data.group.posts.length; n++)
			{
				html += ("<li>" + data.group.posts[n].html + "</li>");
			}
			html += ("</ul>");

			html += ("</article>");

			html += ("</section>");
			displayData(html);
	});
}

function nc_dashboard(u, k, o) 
{
	var html = "<section class='nc_dashboard'>";

	$.getJSON("/api/dashboard/", {username:u, key:k, offset:o}, function(data, status, xhr) 
	{
			html += ("<ul class='nc_dashboard_posts'>");
			for (var n = 0; n < data.dashboard.posts.length; n++)
			{
				html += ("<li>" + data.dashboard.posts[n].html + "</li>");
			}
			html += ("</ul>");

			html += ("</section>");
			displayData(html);
	});
}

function nc_dashboardSearch(u, k, o) 
{
	var html = "<section class='nc_dashboardsearch'>";

	$.getJSON("/api/dashboard/search/", {username:u, key:k, offset:o}, function(data, status, xhr) 
	{
			html += ("<ul class='nc_dashboardsearch_posts'>");
			for (var n = 0; n < data.dashboard.posts.length; n++)
			{
				html += ("<li>" + data.dashboard.posts[n].html + "</li>");
			}
			html += ("</ul>");

			html += ("</section>");
			displayData(html);
	});
}

function nc_post(u, k, g, c) 
{
	var html = "<section class='nc_post'>";	
	$.getJSON("/api/post/", {username:u, key:k, group:g, content:c}, function(data, status, xhr) 
	{
		updateDashboard();
	});
}

function nc_addNoteToPost(u, k, o, i) 
{
	var html = "<section class='nc_addnotetopost'>";

	$.getJSON("/api/post/", {username:u, key:k, operation:o, id:i}, function(data, status, xhr) 
	{
		html += "<span class='nc_addnotetopost_likes'>" + data.likes + "</span>";
		html += "<span class='nc_addnotetopost_dislikes'>" + data.dislikes + "</span>";
		html += "<span class='nc_addnotetopost_repostid'>" + data.repostId + "</span>";			

		html += "</section>";
		displayData(html);
	});
}

function nc_searchUsers(u, k, q, o) 
{
	var html = "<section class='nc_searchusers'>";

	$.getJSON("/api/searchusers/", {username:u, key:k, q:q, offset:o}, function(data, status, xhr) 
	{
		html += ("<ul class='nc_searchusers_users'>");

		for (var n = 0; n < data.users.length; n++)
		{
			html += ("<li>" + data.users[n].html + "</li>");
		}
		html += ("</ul>");

		html += ("</section>");
		displayData(html);
	});
}

function nc_inbox(u, k, o, l, r) 
{
	$.getJSON("/api/inbox/", {username:u, key:k, offset:o, length:l, readmessages:r}, function(data, status, xhr) 
	{
		return data;
	});
}

function nc_inboxCompose(u, k, r, c) 
{
	$.getJSON("/api/inbox/compose/", {username:u, key:k, reciever:r, content:c}, function(data, status, xhr) 
	{
		return data;
	});
}

function nc_outbox(u, k, o, l, r) 
{
	$.getJSON("/api/outbox/", {username:u, key:k, offset:o, length:l, readmessages:r}, function(data, status, xhr) 
	{
		return data;
	});
}

function nc_inboxDelete(u, k, r, c) 
{
	$.getJSON("/api/inbox/delete/", {username:u, key:k, reciever:r, content:c}, function(data, status, xhr) 
	{
		return data;
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
			var html = "<section class=\"post row\" id=\"post" + post.PostID + "\">" +
			"<div class=\"span1\"><img src=\"" + post.UserImage + "\" style=\"max-width:50px; max-height:50px\" /></div>" +
			"<div class=\"span7\">" +
			"<h4 style=\"margin:0;padding:0;\">" + post.UserFullName + "<span style=\"color:grey\"> &#9658 " + post.GroupName + "</span></h4>" + post.HTML + 
			"<p style=\"font-size:smaller;color:#777;\">" + post.TimeDescription + " &#8226 <a href=\"#\">" + post.Likes + " Likes</a> &#8226 " + 
			"<a href=\"#\">" + post.Dislikes + " dislikes</a></p></div></section>";
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
				html += "<li><a href=\"#group-" + data.Data[i].GroupID + "\">" + data.Data[i].GroupName + "</a> <span class=\"label " + (data.Data[i].MyRole == 1 ? "label-success" : "") + "\">" + (data.Data[i].MyRole == 1 ? "Staff" : "Member") + "</span></li>";
			}
			html += "</ul>"
			$("#grouplist").html(html);
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
			html += "<li><a href=\"#group-" + data.Data[i].GroupID + "\">" + data.Data[i].GroupName + "</a></li>";
		}
		$("#groupListContent").html(html);
	});
}