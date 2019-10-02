/**
 * testing the strategy to iterate through SPO folders.
 *
 * SPO folder structure:
 * [SPO SITE] [https://corp.sharepoint.com/sites/mysite]
 *   - [START FOLDER] Root folder
 *     - [CUSTOMER FOLDER] Level one folder
 *       - [PROFILE FOLDER] Level two folder
 *         - FILES
 *       - [PROJECT FOLDER]
 *         - [UTIL FOLDERS]
 */

const spoAuth = require('node-sp-auth');
const axios = require('axios');
// we have to use the ./ as current foler.
const config = require('./../../src/config');
const spoConfig = config.spo;

// try to get access headers
spoAuth.getAuth(spoConfig.spoUrl, 
            {username: spoConfig.username, password: spoConfig.password})
.then(options => {

    let headers = options.headers;
    headers['Accept'] = 'application/json';
    console.log(headers);

    // root folder
    let reqRoot = {
        url: spoConfig.spoUrl + spoConfig.spoSite +
             "/_api/web/getfolderbyserverrelativeurl('" +
             encodeURIComponent(spoConfig.startFolder[0]) + "')/Folders",
        method: "get",
        headers: headers
    };

    // call the API to get response.
    axios.request(reqRoot).then(function(response) {

        // TODO: what's the limit of the Folders API?
        let folders = response.data.value;

        console.log(folders[0]);
        // level 1
        // level 2
    });
});
