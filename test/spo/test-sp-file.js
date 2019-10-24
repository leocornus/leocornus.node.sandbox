/**
 * quick test to use node-sp-auth to connect to SPO
 * and then download files.
 * 
 * execute the test by using the following command:
 *
 *  nvm run node test/spo/test-sp-file.js
 */

const fs = require('fs');
// we have to use the ./ as current foler.
const config = require('./../../src/config');
const spo = require('node-sp-auth');
const request = require('request');
//const request = require('request-promise');
const axios = require('axios');

//console.log(JSON.stringify(config, null, 2));
const configSPO = config.spo;

requestStream();

/**
 * using request lib to handle binary file as stream.
 */
function requestStream() {

    let localFile = '/tmp/test.pdf';
    let output = fs.createWriteStream(localFile);

    spo.getAuth(configSPO.spoUrl, {username: configSPO.username,
                                password: configSPO.password})
    .then(options => {
        // let's check the options.
        // it only contains a cookie which will have the
        // access token.
        console.dir(options);

        // perform request with any http-enabled library
        // (request-promise in a sample below):
        let headers = options.headers;
        //headers['Accept'] = 'application/json;odata=verbose';
        headers['Accept'] = 'application/json';

        // this is the sample to show hte /Folders API.
        filePath = configSPO.samplePathes[0];
        // this is the sample to show hte /Properites API.
        //filePath = configSPO.samplePathes[1];
        // this is the sample to show the /Files API.
        //filePath = configSPO.samplePathes[3];
        // construct the URL.
        let theUrl = configSPO.spoUrl + configSPO.spoSite + filePath;
        console.log(theUrl);

        let req = request.get({
            requestContentType: 'JSON',
            url: `${theUrl}`,
            headers: headers
        // the way for request.
        });

        // here is how to handle the binary file as stream.
        req.on('response', (response) => {
            //process data
            //console.dir(response);
            console.log('Start download using stream...');
            req.pipe(output);
            console.log('DONE Setup pipe...');
            //console.dir(body);
        });

        req.on('end', (res) => {
            console.log('download complete');
        });
    });
}
