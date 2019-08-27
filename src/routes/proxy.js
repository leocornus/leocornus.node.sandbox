"use strict";

const config = require("../config");
const apiProxy = require('http-proxy').createProxyServer();

module.exports = function(app) {

    app.all("/98764/*", function(req, res) {

        console.log('redirecting to Server1');
        apiProxy.web(req, res, {target: "http://52.38.170.135:8764"});
    });

    app.all("/18000/*", function(req, res) {

        console.log('redirecting to 0.9');
        apiProxy.web(req, res, {target: "http://10.34.0.9:18000"});
    });
};
