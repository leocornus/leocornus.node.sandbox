"use strict";

let config = require("../config");
let fs = require('fs');

let azure = require('azure-storage');
let fileService = azure.createFileService(config.azure.storageAccount, 
                                          config.azure.storageAccessKey);

module.exports = function(app) {

    // stream file. 
    app.get("/stream/file", function(req, res) {

        // check the path exist or not.
        if(req.query.hasOwnProperty('path')) {

            //res.send(`File: ${req.query.path}`);
            // get file to stream.
            fileService.getFileToStream(config.azure.storageFileShare, 'csa', '2410984.pdf',
                                        fs.createWriteStream('/tmp/output.pdf'),
                                        function(error, result, response) {
                if (!error) {
                    // if result = true, share was created.
                    // if result = false, share already existed.
                    console.log("getFile----------------");
                    res.send(response);
                }
            });
        } else {
            res.send('Please specify file path!');
        }
    });
};
