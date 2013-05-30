package neonserver

//This file contains all the configuration options for Neon
//In the future these may be accessible through a configuration file
//So that recompilation is not required

//Which port to run the server on. The default (8888) is our recommended although this
//sometimes doesn't work with localhost in Internet Explorer
//But then again, IE rarely works anyway
var Port = 8888;

//Whether or not client side should cache files (and therefore the server should send 304s)
var Cache = true;

//Whether or not the service allows registrations
//You may wish to register allow your users before publically running your service
//It may therefore be appropriate for schools to disable this after launch
//You have to re-enable to register a new user though :(
//The register form will still appear on the login page, you should remove this yourself
var AllowsRegister = true;

//Data store extension
//We set the default as *.jsondb as this doesn't clash with anything
//I recommend that if you are working on Neon in a repo that you add
//Your store extension to the .gitignore file so that you don't commit
//potentially private information - N.B. .jsondb is in ours by default
var StoreExtension = ".jsondb";

//Whether or not to log anything to the console
var ShouldLog = true;

//Whether or not to only log errors. If shouldLog = false this value won't do anything
var ShouldOnlyLogErrors = false;

//If the client directory is not a sub-directory of the directory of neon.go change
//this
var PathToClient = "client"

//Will save one of the splash images once it has been resized. This is recommended for 
//production use however not recommended for debugging because it will result in a lot more
//files added to your repo unnecessarily
var SaveResizedImages = false