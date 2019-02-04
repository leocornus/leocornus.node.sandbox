"use strict";

const config = require("../config");
const Vitrium = require("../libs/vitrium");

let logging = function(message) {

    console.log(message);
};

module.exports = function(app) {

    // download file using the post protocol.
    //app.post("/drm/download", function(req, res) {

    //    // check the body.
    //    logging(req.body);
    //    return res.send(req.body.name);
    //});

    // quick test for download.
    app.get("/drm/download", function(req, res) {

        let vitrium = new Vitrium(
            config.vitrium.accountToken,
            config.vitrium.userName,
            config.vitrium.password
        );

        vitrium.versionUnique(null, (uniqueRes, uniqueErr) => {

            console.log('unique respose header:');
            console.log(uniqueRes.headers);

            // set header from the unique response.
            res.setHeader('content-disposition',
                    uniqueRes.headers['content-disposition']);
            res.setHeader('content-type',
                    uniqueRes.headers['content-type']);
            // the data is a stream.
            uniqueRes.data.pipe(res);
        });
    });
};
