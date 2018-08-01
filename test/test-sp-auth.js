/**
 * quick test to use node-sp-auth to connect to SPO
 * 
 * STATUS:
 * passed test...
 */

// we have to use the ./ as current foler.
const config = require('./../src/config');
const spo = require('node-sp-auth');
const request = require('request');
//const request = require('request-promise');

console.log(JSON.stringify(config, null, 2));

spo.getAuth(config.spoUrl, {username: config.username, 
                            password: config.password})
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
    filePath = config.samplePathes[0];
    let theUrl = config.spoUrl + config.spoSite + filePath;
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
        console.dir(body);
        //console.dir(JSON.parse(body));
    });
});
