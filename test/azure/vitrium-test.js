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
const fs = require('fs');

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
    url: config.vitrium.docApiBaseUrl + 'Version',
    method: 'get',
    headers: headers,
    params: {
        documentId: config.vitrium.testData.docIds[0]
    }
};
axios.request(getVersions).then(function(versionsRes) {
    console.log(versionsRes.config);
    console.dir(versionsRes.data);

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
        console.log(downloadRes.config);
        // the data will be the binary of the file.
        console.log("file Size: " + downloadRes.data.length);
    }).catch(function(downloadErr) {
        console.log(downloadErr.config);
        console.log(downloadErr.response.data);
    });

    /**
     * /Verison/Unique.
     *
     * thie call need set up policy and access policy
     *
     */
    let unique = {
        url: config.vitrium.docApiBaseUrl + 'Version/Unique',
        method: 'post',
        headers: headers,
        data: {
            DocCode: versionsRes.data.Results[0].DocCode,
            UniqueDocCopyId: uuidv4(),
            UserName: 'test',
            DocPolicyOverride: {
                AcroJsGosBehaviorType: 'PromptAndCloseDocument',
                AcroJsGosUnlimitedBehaviourType: 'PromptAndCloseDocument',
                AllowBuildInLoginTemplate: true,
                AllowCopy: true,
                PrintType: 'HighResolution'
            },
            AccessPolicyOverride: {
                ComputersMax: 200,
                OfflineDurationinDays: 700,
                DocumentLimit: 100,
                ExpiryInMins: 52560000
            }
        }
    };
    //console.log(unique);
    axios.request(unique).then(function(uniqueRes) {
        console.log(uniqueRes.config);
        // the data will be the binary of the file.
        console.log("Unique file Size: " + uniqueRes.data.length);

        // save to local
        fs.writeFile('unique.pdf', uniqueRes.data, (wErr) => {
            console.log(wErr);
        });
    }).catch(function(uniqueErr) {
        console.log(uniqueErr.config);
        console.log(uniqueErr.response.data);
    });
}).catch(function(versionsErr) {
    console.log(versionsErr);
});
