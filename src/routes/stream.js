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
            let path = req.query.path;
            let folder = path.substring(0, path.lastIndexOf("/"));
            let filename = path.substring(path.lastIndexOf("/") + 1);
            let localFile = path.substring(1).replace(/\//g, '-');
            console.info(`stream file ${folder}/${filename} to local /tmp/${localFile}`);

            fileService.getFileToStream(config.azure.storageFileShare, folder, filename,
                                        fs.createWriteStream(`/tmp/${localFile}`),
                                        function(error, result, response) {
                if (!error) {
                    // if result = true, share was created.
                    // if result = false, share already existed.
                    console.log("getFile----------------");
                    res.send(response);
                } else {
                    console.log("Error: ");
                    res.send(error);
                }
            });
        } else {
            res.send('Please specify file path!');
        }
    });
};
