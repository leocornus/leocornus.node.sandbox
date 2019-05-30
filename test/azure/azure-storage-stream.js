/**
 * quick test to get the md5 hash for a file stored on Azure storage.
 */

const config = require('./../../src/config');
const fs = require('fs');
const crypto = require('crypto');

const azure = require('azure-storage');

const localConfig = config.azure;

// create file service.
var fileService = azure.createFileService(localConfig.storageAccount,
                                          localConfig.storageAccessKey);

// get file to stream.
fileService.getFileToStream(localConfig.storageFileShare,
                            localConfig.testData[0].folder,
                            localConfig.testData[0].file,
                            fs.createWriteStream(localConfig.testData[0].file),
                            function(error, result, response) {
    if (!error) {
        // if result = true, share was created.
        // if result = false, share already existed.
        console.log("getFile----------------");
        console.dir(response);
        console.log("Result: ");
        console.dir(result);

        var hash = crypto.createHash('md5');
        var s = fs.ReadStream(localConfig.testData[0].file);
        s.on('data', function(d) {
              hash.update(d);
        });

        s.on('end', function() {
              var d = hash.digest('hex');
              console.log(d + '  ' + localConfig.testData[0].file);
        });
    } else {

        console.dir( error );
    }
});
