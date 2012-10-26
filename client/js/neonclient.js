/*
This file is the general client side JS bridge
It can return stuff. Its pretty useful
It does /api/ calls as documented on the wiki
All functions in this file are prefixed with nc_
*/

function saveKey(data) {
	if (data.request.successCode == 200) {
		localStorage.username = data.login.username;
		localStorage.key = data.login.key;
		changeToDashboard();
	}
	else {
		alert(data.request.message);
	}
}


function nc_login(u, p) {
	$.getJSON("/api/login/", {username:u, password:p}, function(data, status, xhr) {
		saveKey(data);
	});
}

function nc_user(u, k, q, o) {
	var html = "<section class='nc_user'>";
	$.getJSON("/api/user/" + q, {username:u, key:k, offset:o}, function(data, status, xhr) {
			html += "<article>";
			html += ("<span class='nc_user_id'>" + data.user.id.toString() + "</span>");
			html += ("<span class='nc_user_username'>" + data.user.username + "</span>");			
			html += ("<span class='nc_user_name'>" + data.user.name.toString() + "</span>");		
			html += ("<img src='" + data.user.userImage + "' class='nc_user_userImage'></img>");
			html += ("<ul class='nc_user_posts'>");
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

function displayData(h){
	console.log(h);
}

function nc_group(u, k, q, o) {
	$.getJSON("/api/group/" + q, {username:u, key:k, offset:o}, function(data, status, xhr) {
		return data;
	});
}

function nc_dashboard(u, k, o) {
	var html = "<section class='nc_dashboard'>";
	$.getJSON("/api/dashboard/", {username:u, key:k, offset:o}, function(data, status, xhr) {
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

function nc_dashboardSearch(u, k, q, o) {
	$.getJSON("/api/dashboard/search/" + q, {username:u, key:k, offset:o}, function(data, status, xhr) {
		return data;
	});
}

function nc_post(u, k, g, c, r) {
	$.getJSON("/api/post/", {username:u, key:k, groupId:g, content:c, responding:r}, function(data, status, xhr) {
		return data;
	});
}

function nc_addNoteToPost(u, k, o, i) {
	$.getJSON("/api/post/", {username:u, key:k, operation:o, id:i}, function(data, status, xhr) {

		return data;
	});
}

function nc_searchUsers(u, k, q, o) {
	$.getJSON("/api/searchusers/", {username:u, key:k, q:q, offset:o}, function(data, status, xhr) {
		return data;
	});
}

function nc_inbox(u, k, o, l, r) {
	$.getJSON("/api/inbox/", {username:u, key:k, offset:o, length:l, readmessages:r}, function(data, status, xhr) {
		return data;
	});
}

function nc_inboxCompose(u, k, r, c) {
	$.getJSON("/api/inbox/compose/", {username:u, key:k, reciever:r, content:c}, function(data, status, xhr) {
		return data;
	});
}

function nc_outbox(u, k, o, l, r) {
	$.getJSON("/api/outbox/", {username:u, key:k, offset:o, length:l, readmessages:r}, function(data, status, xhr) {
		return data;
	});
}

function nc_inboxDelete(u, k, r, c) {
	$.getJSON("/api/inbox/delete/", {username:u, key:k, reciever:r, content:c}, function(data, status, xhr) {
		return data;
	});
}

function nc_register(u, p, n) {
	$.getJSON("/api/register/", {username:u, password:p, name:n}, function(data, status, xhr) {
		saveKey(data);
	});
}