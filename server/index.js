var server = require("./server");
var router = require("./router");
var requestHandlers = require("./handler");

var handle = {}

server.start(router.route, handle);