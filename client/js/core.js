$(window).resize(function()
{
	setBackground();
});

setBackground = function()
{
	var widths = [1024, 1280, 1366, 1440, 1680, 1920, 3000];
	var body_width = $("body").width();

	if(body_width > widths[widths.length - 1]) 
	{ //too big
		var image_path = "splashes/" + width[widths.length - 1] + ".jpg";
	}
	else if(body_width < widths[0]) 
	{ //too small
		var image_path = "splashes/" + widths[0] + ".jpg";
	}
	else 
	{ //juuust right
		var image_width = roundUpWidth(widths, body_width)[1] + ".jpg"
		var image_path = "splashes/" + image_width;
	}
   
	$('#fixedbg').css("background-image", "url('" + image_path + "') !important"); 
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

var verify = function(field)
{
	var value = $('#signup-'+field).val();
	
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