
$(document).ready(function(){
	setBackground();
});

$(window).resize(function(){
	setBackground();
});

setBackground = function(){
	var widths = [1024, 1280, 1366, 1440, 1920, 1920];
	var body_width = $("body").width();

	if(body_width > 1920) { //too big
		var image_path = "splashes/1920.jpg";
	}
	else if(body_width < 1024) { //too small
		var image_path = "splashes/1024.jpg";
	}
	else { //juuust right
		var image_width = roundUpWidth(widths, body_width)[1] + ".jpg"
		var image_path = "splashes/" + image_width;
	}


	$('body').css("background", "url('" + image_path + "') 100% no-repeat fixed ");
}


var roundUpWidth = function(a, x) {
    var lo, hi;
    for (var i = a.length; i--;) {
        if (a[i] <= x && (lo === undefined || lo < a[i])) lo = a[i];
        if (a[i] >= x && (hi === undefined || hi > a[i])) hi = a[i];
    };
    return [lo, hi];
}

$('#signuplink').live("click", function(e){
	e.preventDefault();
	$('#input_group').animate({'height':'200'}, 700, function(){
		$('#input-group-signup').attr('style', 'display:block');;
	});
});

var changeToDashboard = function(){
	var dashboard_data = nc_dashboard(localStorage.username, localStorage.key);
	alert("registered, going to dashboard");
}