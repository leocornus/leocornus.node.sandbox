"use strict";

const config = require("../config");
const Vitrium = require("../libs/vitrium');

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

    // quick test for download.
    app.get("/drm/download", function(req, res) {

        let vitrium = new Vitrium(
            config.vitrium.accountToken,
            config.vitrium.userName,
            config.vitrium.password,
        );

        vitrium.versionUnique((uniqueRes, uniqueErr) => {
            // set header from the unique response.
            res.setHeader('Content-disposition',
                    uniqueRes.headers['Content-disposition']);
            res.setHeader('Content-type',
                    uniqueRes.headers['Content-type']);
            // the data is a stream.
            uniqueRes.data.pipe(res);
        });
    });
};
