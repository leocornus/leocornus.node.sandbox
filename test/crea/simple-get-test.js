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
        //Format: 'Standard-XML',
        Format: 'COMPACT',
        //ID: '*',
        ID: '0',
    },
    headers: {
        Authorization: localConfig.sampleAuthorization,
        //Cookie: localConfig.sampleHeader['set-cookie'].join("; ")
        Cookie: localConfig.sampleHeader['cookie']
    }
};

axios.get(localConfig.metadataUrl, getMetadata)
    .then(function(response) {

        console.dir(response.data);
        console.log('Success');
    }).catch(function(error) {
        console.dir(error);
        console.log('Failed!');
    });
