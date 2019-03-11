"use strict";

// using the UUID v4.
const uuidv4 = require('uuid/v4');
const config = require("../config");
const Vitrium = require("../libs/vitrium");

let logging = function(message) {

    console.log(message);
};

module.exports = function(app) {

    // download file using the post protocol.
    app.post("/drm/download", function(req, res) {

        // check the body.
        logging(req.body);

        let vitrium = new Vitrium(
            config.vitrium.accountToken,
            config.vitrium.userName,
            config.vitrium.password
        );

        // the req.body will the payload.
        vitrium.versionUnique(req.body, (uniqueRes, uniqueErr) => {

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

    // quick test for download.
    app.get("/drm/download", function(req, res) {

        // redirect to homepage.
        res.redirect(301, config.server.homeRedirectUrl);
    });

    // quick test for download.
    app.get("/drm/gdownload", function(req, res) {

        let vitrium = new Vitrium(
            config.vitrium.accountToken,
            config.vitrium.userName,
            config.vitrium.password
        );

        let docReq = {
          "DocCode": config.vitrium.testData.docCodes[0],
          "UserName": config.vitrium.testData.users[0],
          "UserSetType": 'Retail',
          "DocExpiryDate": '2069-12-31'
        };

        vitrium.versionUnique(docReq, (uniqueRes, uniqueErr) => {

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
