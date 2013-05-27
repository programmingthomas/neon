package neon
//Config.js contains all core options...

//Which port to run the server on. The default (8888) is our recommended
var port = 8888;

//Whether or not client side should cache files (and therefore the server should send 304s)
var cache = true;

//Whether or not the service allows registrations
//You may wish to register allow your users before publically running your service
//It may therefore be appropriate for schools to disable this after launch
//You have to re-enable to register a new user though :(
var allowsRegister = true;

//Data store extension
//We set the default as *.jsondb as this doesn't clash with anything
var storeExtension = ".jsondb";

//Whether or not to log anything to file/console
var shouldLog = true;

//Whether or not to only log errors. If shouldLog = false this value won't do anything
var shouldOnlyLogErrors = false;