const config = require('./../../src/config');
const fs = require('fs');
const crypto = require('crypto');

const azure = require('azure-storage');

const localConfig = config.azure;

// create file service.
var fileService = azure.createFileService(localConfig.storageAccount,
                                          localConfig.storageAccessKey);

var hash = crypto.createHash('md5');
// get file to stream.
fileService.getFileToStream(localConfig.storageFileShare,
                            localConfig.testData[0].folder,
                            localConfig.testData[0].file,
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
