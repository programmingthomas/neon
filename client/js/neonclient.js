var loaded = false;
var userSplash;


/*$(document)
	.ready(function() {
	if (!loaded) {
		setBackground();
		loaded = true;
		console.log(window.location.hash);
		if (localStorage.username != undefined && localStorage.passkey != undefined && localStorage.username != null && localStorage.passkey != null && localStorage.username != "null" && localStorage.passkey != "null") {
			if (window.location.hash == "" || window.location.hash == "#home") changeToDashboard();
			else if (window.location.hash == "#groups") showGroups();
			else if (window.location.hash.indexOf("#group-") == 0) showGroup(window.location.hash);
			else if (window.location.hash.indexOf("#profile-") == 0) showProfile(window.location.hash);
			else if (window.location.hash == "#settings") showSettings();
		} else {
			$.get("welcomedom.html", {}, function(data, status, xhr) {
				$("#pagecontent")
					.html(data);
			}, "html");
		}

		if ("-ms-user-select" in document.documentElement.style && navigator.userAgent.match(/IEMobile\/10\.0/)) {
			var msViewportStyle = document.createElement("style");
			msViewportStyle.appendChild(
			document.createTextNode("@-ms-viewport{width:auto!important}"));
			document.getElementsByTagName("head")[0].appendChild(msViewportStyle);
		}
	}
});*/

$(window)
	.resize(function() {
	setBackground();
});
/*function nc_login(u, p) {
		$.getJSON("/api/login/", {
			username: u,
			password: p
		}, function(data, status, xhr) {
			loginAttemptApproved(data)
		});
	}*/


	function nc_creategroup(n) {
		$.postJSON("/api/group/create", {
			username: localStorage.username,
			key: localStorage.passkey,
			name: n
		}, function(data, status, xhr) {
			showGroups();
		});
	}

	function showAllGroups() {
		$.getJSON("/api/group/all", {
			username: localStorage.username,
			key: localStorage.passkey
		}, function(data, status, xhr) {
			var html = "<ul>";
			for (var i = 0; i < data.Data.length; i++) {
				html += "<li><a class=\"grouplink\" href=\"#group-" + data.Data[i].GroupID + "\">" + data.Data[i].GroupName + "</a></li>";
			}
			$("#groupListContent")
				.html(html);
			addGroupLink();
		});
	}
