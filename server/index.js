var server = require("./server");
var router = require("./router");
var requestHandlers = require("./handler");


server.start(router.route);