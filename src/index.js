"use strict";

let config = require("./config");
let chalk = require("chalk");

let app = require("./core/express")();

app.listen(config.server.port, config.server.ip, function() {

	console.info("");
	console.info(config.server.title + " v" + config.server.version + " application started!");
	console.info("----------------------------------------------");
	console.info("Environment: " + chalk.underline.bold(process.env.NODE_ENV));
	console.info("IP:          " + config.server.ip);
	console.info("Port:        " + config.server.port);
	console.info("");

	//require("./libs/sysinfo")();

	console.info("----------------------------------------------");
});

exports = module.exports = app;
