/**
 * quick test to get connect to CREA service.
 */

const axios = require('axios');

// load configuration
const config = require('./../../src/config');
const localConfig = config.crea;

console.log(localConfig.metadataUrl);

var getMetadata = {
    params: {
        Type: 'METADATA-CLASS', 
        Format: 'Standard-XML',
        ID: '*',
    },
    headers: {
        Cookie: localConfig.sampleHeader['set-cookie'].join("; ")
    }
};

axios.get(localConfig.metadataUrl, getMetadata)
    .then(function(response) {

        //console.dir(response);
        console.log('Success');
    }).catch(function(error) {
        console.dir(error);
        console.log('Failed!');
    });
