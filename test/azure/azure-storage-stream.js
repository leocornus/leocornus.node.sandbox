const config = require('./../../src/config');
const fs = require('fs');
const crypto = require('crypto');

const azure = require('azure-storage');

// create file service.
var fileService = azure.createFileService(config.azure.storageAccount, 
                                          config.azure.storageAccessKey);

var hash = crypto.createHash('md5');
// get file to stream.
fileService.getFileToStream(config.azure.storageFileShare, 'csa', '2410984.pdf',
                            hash,
                            function(error, result, response) {
    if (!error) {
        // if result = true, share was created.
        // if result = false, share already existed.
        console.log("getFile----------------");
        console.dir(response);
        // output the sum in hex format.
        console.log(hash.digest('hex'));
    }
});
