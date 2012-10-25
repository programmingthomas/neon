$(document).ready(function(){
	var widths = [1024, 1280, 1360, 1366, 1440, 1680, 1920, 1920];
	var body_width = $("body").width();

	console.log("width is " + body_width + ", returning image " + roundUpWidth(widths, body_width)[1] + ".jpg");
	var image_width = roundUpWidth(widths, body_width)[1] + ".jpg"
	var image_path = "splashes/" + image_width;

	$('body').css("background", "url('" + image_path + "') no-repeat fixed");
});

$(window).resize(function(){
	var widths = [1024, 1280, 1360, 1366, 1440, 1680, 1920, 1920];
	var body_width = $("body").width();

	console.log("width is " + body_width + ", returning image " + roundUpWidth(widths, body_width)[1] + ".jpg");
	var image_width = roundUpWidth(widths, body_width)[1] + ".jpg"
	var image_path = "splashes/" + image_width;

	$('body').css("background", "url('" + image_path + "') no-repeat fixed");
});

var roundUpWidth = function(a, x) {
    var lo, hi;
    for (var i = a.length; i--;) {
        if (a[i] <= x && (lo === undefined || lo < a[i])) lo = a[i];
        if (a[i] >= x && (hi === undefined || hi > a[i])) hi = a[i];
    };
    return [lo, hi];
}

$('#signuplink').live("click", (function(e){
	e.preventDefault();
	$('#input_group_signup').animate({'height':'400'}, 700);
}));

var changeToDashboard = function(){
	var dashboard_data = nc_dashboard(localStorage.username, localStorage.key);
	alert("registered, going to dashboard");
}