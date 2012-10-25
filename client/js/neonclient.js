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
	$.getJSON("/api/user/" + q, {username:u, key:k, offset:o}, function(data, status, xhr) {
		return data;
	});
}

function nc_group(u, k, q, o) {
	$.getJSON("/api/group/" + q, {username:u, key:k, offset:o}, function(data, status, xhr) {
		return data;
	});
}

function nc_dashboard(u, k, o) {
	$.getJSON("/api/dashboard/", {username:u, key:k, offset:o}, function(data, status, xhr) {
		return data;
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
	$.getJSON("/api/register", {username:u, password:p, name:n}, function(data, status, xhr) {
		saveKey(data);
	});
}