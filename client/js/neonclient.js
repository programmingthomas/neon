/*
This file is the general client side JS bridge
It can return stuff. Its pretty useful
It does /api/ calls as documented on the wiki
All functions in this file are prefixed with nc_
*/

function nc_login(username, password)
{
	console.log("Going to attempt a login");

}

function nc_register(u, p, n) {
	$.getJSON("/api/register", {username:u, password:p, name:n}, function(data, status, xhr)
	{
		if (data.request.successCode == 200) {
			var username = data.login.username;
			var key = data.login.key;
		}
	});
}