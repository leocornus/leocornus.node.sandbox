/**
 * quick test case to try the azure-storage module.
 */

const config = require('./../../src/config');
const fs = require('fs');

const azure = require('azure-storage');

const localConfig = config.azure;

var fileService = azure.createFileService(localConfig.storageAccount, 
                                          localConfig.storageAccessKey);

// Access Share!
fileService.createShareIfNotExists(localConfig.storageFileShare, 
                                   function(error, result, response) {
    if (!error) {
        // if result = true, share was created.
        // if result = false, share already existed.
        console.dir(response);
    }
});

// access directory.
fileService.createDirectoryIfNotExists(localConfig.storageFileShare,
                                       localConfig.testData[0].folder,
                                       function(error, result, response) {
    if (!error) {
        // if result = true, share was created.
        // if result = false, share already existed.
        console.log("Directory ----------------");
        console.dir(response);
    }
});

// get file to stream.
fileService.getFileToStream(config.azure.storageFileShare,
                            localConfig.testData[0].folder,
                            localConfig.testData[0].file,
                            fs.createWriteStream('output.pdf'),
                            function(error, result, response) {
    if (!error) {
        // if result = true, share was created.
        // if result = false, share already existed.
        console.log("getFile----------------");
        console.dir(response);
    }
});
