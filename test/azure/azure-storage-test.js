const config = require('./../../src/config');
const azure = require('azure-storage');

var fileService = azure.createFileService(config.azure.storageAccount, 
                                          config.azure.storageAccessKey);

fileService.createShareIfNotExists(config.azure.storageFileShare, 
                                   function(error, result, response) {
    if (!error) {
        // if result = true, share was created.
        // if result = false, share already existed.
        console.dir(response);
    }
});
