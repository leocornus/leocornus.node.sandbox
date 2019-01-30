"use strict";

const config = require("../config");

let logging = function(message) {

    console.log(message);
};

module.exports = function(app) {

    // download file using the post protocol.
    app.post("/drm/download", function(req, res) {

        // check the body.
        logging(req.body);
        return res.send(req.body.name);
    });
};
