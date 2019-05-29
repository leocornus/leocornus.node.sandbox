/**
 * quick test to get connect to Tika server using the request module
 *
 * Overview about Tika server:
 * - https://wiki.apache.org/tika/TikaJAXRS
 */

const request = require('request');
const fs = require('fs');

// load configuration
const config = require('./../../src/config');
const localConfig = config.tika;

let formData = {
    file: fs.createReadStream(localConfig.testData[0].file)
};

let metaReq = {
    url: localConfig.baseUrl + 'meta/form', 
    headers: {
        "Accept": "application/json",
        "Content-Type": "multipart/form-data"
    },
    formData: formData
};

request.post( metaReq, function(err, res, body) {

    console.dir(body);
    console.log("type of body: " + typeof(body));
    console.dir(JSON.parse(body));
    //console.dir(res);
} );
