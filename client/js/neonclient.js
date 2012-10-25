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

function nc_register(u, p, n) {
	$.getJSON("/api/register", {username:u, password:p, name:n}, function(data, status, xhr) {
		saveKey(data);
	});
}

function nc_login(u, p) {
	$.getJSON("/api/login", {username:u, password:p}, function(data, status, xhr) {
		saveKey(data);
	});
}

function nc_dashboard(u, k) {
	$.getJSON("/api/dashboard", {username:u, key:k}, function(data, status, xhr) {
		return data;
	});
}