/**
 * quick test to use node-sp-auth to connect to SPO
 * using axios to call REST APIs.
 * 
 * STATUS:
 * passed test...
 */

const spoAuth = require('node-sp-auth');
// we have to use the ./ as current foler.
const config = require('./../src/config');
const spo = require('./../src/spo');

spoAuth.getAuth(config.spoUrl, 
            {username: config.username, password: config.password})
.then(options => {

    // let's check the options.
    // it only contains a cookie which will have the
    // access token.
    //console.dir(options);

    // get ready header.
    let headers = options.headers;
    //headers['Accept'] = 'application/json;odata=verbose';
    headers['Accept'] = 'application/json';

    let siteUrl = config.spoUrl + config.spoSite;
    //console.log(theUrl);

    spo.processFolder(siteUrl, config.startFolder[0], headers);
});
