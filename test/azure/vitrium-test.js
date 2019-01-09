/**
 * simple test case to show how to use Vitrium APIs.
 *
 * How to run the test.
 *
 *  $ cd src
 *  $ ln -s ....vitrium.js local.js // link the local.js for vitrium
 *  $ cd ..
 *  $ nvm run node test/azure/vitrium-test.js
 */

const axios = require('axios');
// using the UUID v4.
const uuidv4 = require('uuid/v4');
// hmac-sha1 crypto
const hmacsha1 = require('crypto-js/hmac-sha1');
// we should have separate local.js file for vitrium.
const config = require('./../../src/config');

// set up the request header.
let headers = {};
// update headers with new tokens.
// TODO: check to make sure the reponse has new tokens
headers['X-VITR-ACCOUNT-TOKEN'] = config.vitrium.oAccountToken;
headers["X-VITR-SESSION-TOKEN"] = config.vitrium.oSessionToken;

/**
 * Step 3: get all versions for a document.
 *         /api/2.0/Version?documentId=
 *         we will get many things from here:
 *         - DocCode
 *         - WebViewUrl
 *         - DownloadUrl
 *         - ProtectionPassword
 *         - Unique version id
 */
// get read the request.
let getVersions = {
    url: config.vitrium.docApiBaseUrl + '/Version',
    method: 'get',
    headers: headers,
    params: {
        documentId: config.vitrium.testData.docIds[0]
    }
};
axios.request(getVersions).then(function(versionsRes) {
    console.log(versionsRes.config);
    console.log(versionsRes.data);

    /**
     *
     * Step 4: Download file.
     *         /api/2.0/Version/File/[UNIQUE VERSION ID]
     */
    let download = {
        url: versionsRes.data.Results[0].DownloadUrl,
        method: 'get',
        headers: headers,
    };
    axios.request(download).then(function(downloadRes) {
        //
        console.dir(downloadRes.data);
    }).catch(function(downloadErr) {
        console.log(downloadErr.config);
        console.log(downloadErr.response.data);
    });
}).catch(function(versionsErr) {
    console.log(versionsErr);
});
