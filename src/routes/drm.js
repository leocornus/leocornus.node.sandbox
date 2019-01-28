"use strict";

const config = require("../config");

module.exports = function(app) {

    // download file using the post protocol.
    app.post("/drm/download", function(req, res) {

        // check the body.
        console.log(req.body);
        return res.send(req.body.name);
    });
};
