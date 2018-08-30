/**
 * quick test to use node-sp-auth to connect to SPO
 * using axios to call REST APIs.
 * 
 * STATUS:
 * passed test...
 */

// we have to use the ./ as current foler.
const config = require('./../src/config');
// the 
const spoAuth = require('node-sp-auth');
const axios = require('axios');

console.log(JSON.stringify(config, null, 2));

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

    // try to get properties for a file.
    let filePath = config.samplePathes[1];
    let theUrl = config.spoUrl + config.spoSite + filePath;
    //console.log(theUrl);

    // prepare the axios request config.
    let reqConfig = {
      url: theUrl,
      method: "get",
      headers: headers,
    };

    // call the API to get response.
    axios.request(reqConfig).then(function(response) {
        // dir will show up proper indention for a JSON
        // object
        console.dir(response);
        // TODO: process data
    });
});
