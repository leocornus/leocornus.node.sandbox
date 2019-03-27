"use strict";

// using the UUID v4.
const config = require("../config");
const Search = require("../libs/search");

module.exports = function(app) {

    let search = new Search(config.solr.baseUrl);

    // display the search server information.
    app.get("/solr/info", function(req, res) {

        let info = search.info();

        res.setHeader('Content-Type', "application/json;charset=utf-8");

        //res.send("Hello Solr: " + info.endpoint);
        res.json(info);
    });

    // basic search function.
    app.get("/solr/select", function(req, res) {

        search.select(req.query, function(response, error){

            res.json(response.data);
        });
    });
};
