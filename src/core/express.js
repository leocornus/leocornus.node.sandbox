"use strict";

let config = require("../config");
let express = require("express");
let cors = require("cors");
let bodyParser = require("body-parser");

module.exports = function() {

    // Create express app
    let app = express();
    // set up CORS:
    app.use(cors());

    // use body-parser as the middle-ware.
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    // Load routes
    require("../routes")(app);

    return app;
};
