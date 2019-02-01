"use strict";

let config      = require("../config");

module.exports = function(app) {

    // Index page
    app.get("/", function(req, res) {

        res.redirect(301, config.server.homeRedirectUrl);
    });

    // stream apis.
    require("./stream.js")(app);

    // some client.
    require("./client.js")(app);

    // some clients dddddddd.
    require("./drm.js")(app);
};
