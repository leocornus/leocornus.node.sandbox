"use strict";

let config      = require("../config");

module.exports = function(app) {

    // Index page
    app.get("/", function(req, res) {

        res.redirect(301, config.server.homeRedirectUrl);
    });

    // stream apis.
    //require("./stream.js")(app);

    //// some client.
    //require("./client.js")(app);

    //// DRM client.
    //require("./drm.js")(app);

    //// solr
    //require("./solr.js")(app);

    // proxy
    require("./proxy.js")(app);

    // redirect 404 page to home page.
    app.use(function (req, res, next) {
        res.status(404).redirect(301, config.server.homeRedirectUrl);
    })
};
