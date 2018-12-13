"use strict";

let config = require("../config");

let azure = require('azure-storage');

module.exports = function(app) {

    // Login page
    app.get("/stream/file", function(req, res) {

        res.send(`File: ${req.query.path}`);
    });
};
