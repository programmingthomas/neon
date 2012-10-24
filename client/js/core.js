$('#login-username, #login-password').bind('click', function(){
	$(this).attr('placeholder', '');
});

$('#login-username').bind('blur', function(){
	$(this).attr('placeholder', 'Username');
});

$('#login-password').bind('blur', function(){
	$(this).attr('placeholder', 'Password');
});