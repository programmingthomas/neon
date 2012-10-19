var server = require("./server");
var router = require("./router");
var requestHandlers = require("./handler");
var log = require("./logger");


log.i("index.js", "Starting server");
server.start(router.route);