/**
 * quick test to use node-sp-auth to connect to SPO
 * 
 * STATUS:
 * passed test...
 *
 * execute the test by using the following command:
 *
 *  nvm run node test/test-sp-auth.js
 */

// we have to use the ./ as current foler.
const config = require('./../../src/config');
const spo = require('node-sp-auth');
const request = require('request');
//const request = require('request-promise');

//console.log(JSON.stringify(config, null, 2));
const configSPO = config.spo;

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
    filePath = configSPO.samplePathes[4];
    // this is the sample to show hte /Properites API.
    //filePath = configSPO.samplePathes[1];
    // this is the sample to show the /Files API.
    //filePath = configSPO.samplePathes[3];
    // construct the URL.
    let theUrl = configSPO.spoUrl + configSPO.spoSite + filePath;
    console.log(theUrl);

    request.get({
        requestContentType: 'JSON',
        url: `${theUrl}`,
        headers: headers
    // the way for request.
    }, function(error, response, body) {
    // the way for request promise.
    //}).then(function(error, response, body) {
        //process data
        //console.dir(response);
        //console.dir(body);
        console.dir(JSON.parse(body));
    });
});
