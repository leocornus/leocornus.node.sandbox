"use strict";

let config = require("../config");
let express = require("express");

module.exports = function() {

    // Create express app
    let app = express();

    // Load routes
    require("../routes")(app);

    return app;
};
