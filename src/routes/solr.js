"use strict";

// using the UUID v4.
const config = require("../config");
const Search = require("../libs/search");

module.exports = function(app) {

    // quick test for download.
    app.get("/solr/select", function(req, res) {

        // redirect to homepage.
        res.send("Hello Solr");
    });
};
