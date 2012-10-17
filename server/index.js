var server = require("./server");
var router = require("./router");
var requestHandlers = require("./handler");

var handle = {}
handle["/index.html"] = requestHandlers.index;
handle["/css"] = requestHandlers.css;
handle["/"] = requestHandlers.index;
handle["/start"] = requestHandlers.start;
handle["/upload"] = requestHandlers.upload;

server.start(router.route, handle);