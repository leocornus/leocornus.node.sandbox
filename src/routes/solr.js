"use strict";

// using the UUID v4.
const config = require("../config");
const Search = require("../libs/search");

module.exports = function(app) {

    let search = new Search(config.solr.baseUrl);

    // quick test for download.
    app.get("/solr/info", function(req, res) {

        let info = search.info();
        // redirect to homepage.
        res.send("Hello Solr: " + info.endpoint);
    });
};
