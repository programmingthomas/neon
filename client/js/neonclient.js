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

$(document)
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
});

$(window)
	.resize(function() {
	setBackground();
});

function setBackground() {
	var widths = [600, 750, 1024, 1280, 1366, 1440, 1680, 1920, 3000];
	var body_width = $("body")
		.width();
	var splashes = ["cornfield", "hills", "island", "sea", "sunset", "sun", "yellowstone"];
	var randomSplash = splashes[Math.floor(Math.random() * splashes.length)];

	if (body_width > widths[widths.length - 1]) { //too big
		var image_width = width[widths.length - 1];
	} else if (body_width < widths[0]) { //too small
		var image_width = widths[0];
	} else { //juuust right
		var image_width = roundUpWidth(widths, body_width)[1];
	}

	$("#fixedbg")
		.css("background-image", "url('splashes/" + randomSplash + "/" + image_width + ".jpg')");
}

var roundUpWidth = function(a, x) {
	var lo, hi;
	for (var i = a.length; i--;) {
		if (a[i] <= x && (lo === undefined || lo < a[i])) lo = a[i];
		if (a[i] >= x && (hi === undefined || hi > a[i])) hi = a[i];
	};
	return [lo, hi];
}

var verify = function(field) {
	var value = $('#signup-' + field)
		.val();

	if (field == "realname") {
		if (value.length >= 0) {
			var result = "Your <b>full</b> name";
		} else {
			var result = "It's good";
		}
	}
	$('#' + field + 'hint')
		.innerHTML = result;
}

	function nc_login(u, p) {
		$.getJSON("/api/login/", {
			username: u,
			password: p
		}, function(data, status, xhr) {
			loginAttemptApproved(data)
		});
	}

	function nc_register(u, p, r) {
		$.postJSON("/api/register/", {
			username: u,
			password: p,
			name: r
		}, function(data, status, xhr) {
			loginAttemptApproved(data)
		});
	}

	function loginAttemptApproved(data) {
		if (data.SuccessCode == 200) {
			localStorage.username = data.Data.Username;
			//localStorage.key is a function, so I went for passkey instead
			localStorage.passkey = data.Data.KeyCode;
			changeToDashboard();
		} else {
			$(".loginsignuperror")
				.text(data.Message);
		}
	}


	function nc_post(u, k, g, c) {
		var html = "<section class='nc_post'>";
		$.getJSON("/api/post/", {
			username: u,
			key: k,
			group: g,
			content: c
		}, function(data, status, xhr) {
			updateDashboard();
		});
	}

	function changeToDashboard() {
		$("#welcomebox")
			.fadeOut(500);
		$.get("dashboarddom.html", {}, function(data, status, xhr) {
			$("#pagecontent")
				.html(data);
			updateDashboard();
		}, "html");
	}

	function updateDashboard() {
		$.getJSON("/api/dashboard", {
			username: localStorage.username,
			key: localStorage.passkey
		}, function(data, status, xhr) {
			document.title = "Dashboard - Neon";
			$("#dashrealname")
				.text(data.Data.User.Name);
			$("#dashusername")
				.text("@" + data.Data.User.Username);
			$('#profileLink')
				.click(function(event) {
				goToPage("profile-" + data.Data.User.UserID);
			});
			document.getElementById("dashuserimage")
				.src = data.Data.User.UserImage;
			var dashPosts = document.getElementById("dashposts");
			dashPosts.innerHTML = "";
			for (var i = 0; i < data.Data.Posts.length; i++) {
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

	function HTMLForPost(post) {
		var groupLink = post.GroupID.toString();
		var profileLink = post.UserID.toString();
		return "<section class=\"post row\" id=\"post" + post.PostID + "\">" + "<div class=\"span1\"><img src=\"" + post.UserImage + "\" id=\"postUserImage\" /></div>" + "<div class=\"span7\">" + "<h4 style=\"margin:0;padding:0;\"> <a onclick=\"goToPage('profile-" + profileLink + "')\" href=\"#\">" + post.UserFullName + "</a><span style=\"color:grey\"> &#9658 <a onclick=\"goToPage('group-" + groupLink + "')\" href=\"#\">" + post.GroupName + "</a></span></h4>" + post.HTML + "<p style=\"font-size:smaller;color:#777;\">" + post.TimeDescription + " &#8226 <a href=\"#\">" + post.Likes + " Likes</a> &#8226 " + "<a href=\"#\">" + post.Dislikes + " dislikes</a></p></div></section>";
	}

	function goToPage(hash) { // I'm sure there is a better way of doing this and I don't mind this function being scrapped and replaced for something better
		window.location = "#" + hash;
		window.location.reload(true);
	}

	function logout() {
		localStorage.passkey = null;
		localStorage.username = null;
		$.get("welcomedom.html", {}, function(data, status, xhr) {
			$("#pagecontent")
				.html(data);
			changeMenuHighlight("home");
			document.title = "Neon";
		}, "html");
	}

	function changeMenuHighlight(newpage) {
		$("#homelink")
			.removeClass("active");
		$("#groupslink")
			.removeClass("active");
		$("#maillink")
			.removeClass("active");
		$("#" + newpage + "link")
			.addClass("active");
	}

	function showGroups() {
		$.get("groupsdom.html", {}, function(data, status, xhr) {
			document.title = "Groups - Neon";
			$("#pagecontent")
				.html(data);
			$.getJSON("/api/group/mine", {
				username: localStorage.username,
				key: localStorage.passkey
			}, function(data, status, xhr) {
				var html = "<ul>"
				for (var i = 0; i < data.Data.length; i++) {
					html += "<li><a class=\"grouplink\" href=\"#group-" + data.Data[i].GroupID + "\">" + data.Data[i].GroupName + "</a> <span class=\"label " + (data.Data[i].MyRole == 1 ? "label-success" : "") + "\">" + (data.Data[i].MyRole == 1 ? "Staff" : "Member") + "</span></li>";
				}
				html += "</ul>"
				$("#grouplist")
					.html(html);
				addGroupLink();
			});
			changeMenuHighlight("groups");
		}, "html");
	}

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

	function showGroup(hash) {
		var g = hash.replace("#group-", "")
		$.get('groupdom.html', {}, function(data, textStatus, xhr) {
			$("#pagecontent")
				.html(data);
			$.getJSON("/api/group/" + g, {
				username: localStorage.username,
				key: localStorage.passkey
			}, function(data, status, xhr) {
				$("#groupname")
					.text(data.Data.GroupName);
				$("#groupauthor")
					.text("Group created by " + data.Data.GroupCreatorName);
				$("#groupjoin")
					.click(function() {
					$.postJSON("/api/group/join", {
						username: localStorage.username,
						key: localStorage.passkey,
						group: g
					}, function(data, status, xhr) {
						showGroup("#group-" + g);
					});
				});
				var html = "";
				for (var i = 0; i < data.Data.Posts.length; i++) {
					html += HTMLForPost(data.Data.Posts[i]);
				}
				$("#groupcontent")
					.html(html);

				var members = "";

				for (var i = 0; i < data.Data.MemberImages.length; i++) {
					members += "<img src=\"" + data.Data.MemberImages[i] + "\" />";
				}
				$("#groupmembers")
					.html(members);
			});
			changeMenuHighlight("groups");
		}, "html");
	}

	function addGroupLink() {
		$(".grouplink")
			.click(groupLinkClicked);
	}

	function groupLinkClicked() {
		showGroup($(this)
			.attr("href"));
	}

	function showProfile(hash) {
		var g = hash.replace("#profile-", "")
		$.get('profiledom.html', {}, function(data, textStatus, xhr) {
			document.title = (data.Data.Username + " - Neon");
			$("#pagecontent")
				.html(data);
			$.getJSON("/api/user/" + g, {
				username: localStorage.username,
				key: localStorage.passkey
			}, function(data, status, xhr) {
				$("#username")
					.text("@" + data.Data.Username);
				$("#name")
					.text(data.Data.Name);
				$("#profilePicture")
					.attr("src", (data.Data.UserImage));

				var html = "";
				for (var i = 0; i < data.Data.Posts.length; i++) {
					html += HTMLForPost(data.Data.Posts[i]);
				}
				$("#usercontent")
					.html(html);

			});
			changeMenuHighlight("none");
		}, "html");
	}

	function showSettings() {
		$.get("settingsdom.html", {}, function(data, status, xhr) {
			document.title = "Settings - Neon";
			$("#pagecontent")
				.html(data);
			changeMenuHighlight("none");
		}, "html");
	}