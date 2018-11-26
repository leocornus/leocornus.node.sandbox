const config = require('./../../src/config');
const azure = require('azure-storage');

var fileService = azure.createFileService(config.azure.storageAccount, 
                                          config.azure.storageAccessKey);

// Access Share!
fileService.createShareIfNotExists(config.azure.storageFileShare, 
                                   function(error, result, response) {
    if (!error) {
        // if result = true, share was created.
        // if result = false, share already existed.
        console.dir(response);
    }
});

// access directory.
fileService.createDirectoryIfNotExists(config.azure.storageFileShare, 'csa',
                                       function(error, result, response) {
    if (!error) {
        // if result = true, share was created.
        // if result = false, share already existed.
        console.log("Directory ----------------");
        console.dir(response);
    }
});
