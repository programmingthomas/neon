$(document).ready(function()
{
	setBackground();

	$('#signup-realname').bind("keyup", function()
	{
		verify('realname');
	});

	$('#signup-username').bind("keyup", function()
	{
		verify('username');
	});

});

$(window).resize(function()
{
	setBackground();
});

setBackground = function()
{
	var widths = [1024, 1280, 1366, 1440, 1920, 1920];
	var body_width = $("body").width();

	if(body_width > 1920) 
	{ //too big
		var image_path = "splashes/1920.jpg";
	}
	else if(body_width < 1024) 
	{ //too small
		var image_path = "splashes/1024.jpg";
	}
	else 
	{ //juuust right
		var image_width = roundUpWidth(widths, body_width)[1] + ".jpg"
		var image_path = "splashes/" + image_width;
	}


	$('body').css("background", "url('" + image_path + "') 100% no-repeat fixed ");
}


var roundUpWidth = function(a, x) 
{
    var lo, hi;
    for (var i = a.length; i--;) 
    {
        if (a[i] <= x && (lo === undefined || lo < a[i])) lo = a[i];
        if (a[i] >= x && (hi === undefined || hi > a[i])) hi = a[i];
    };
    return [lo, hi];
}

var changeToDashboard = function()
{
	var dashboard_data = nc_dashboard(localStorage.username, localStorage.key);
	alert("registered, going to dashboard");
}




var verify = function(field)
{
	var value = $('#signup-'+field).val();
	console.log(value);

	if(field=="realname") 
	{
		if(value.length>=0) 
		{
			var result = "Your <b>full</b> name";
		}
		else 
		{
			var result = "It's good";
		}
	}
	$('#'+field+'hint').innerHTML = result;
}