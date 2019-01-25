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
 * /Verison/Unique.
 *
 * thie call need set up policy and access policy
 *
 */
let unique = {
    url: config.vitrium.docApiBaseUrl + 'Version/Unique',
    method: 'post',
    // default is JSON type
    responseType: 'stream',
    headers: headers,
    data: {
      "DocCode": config.vitrium.testData.docCodes[0],
      "UserName": config.vitrium.testData.users[0],
      "UniqueDocCopyId": uuidv4(),
      "DocPolicyOverride": {
        "PrintType": "HighResolution",
        "AllowCopy": true,
        "AllowBuildInLoginTemplate": true,
        "AcroJsGosUnlimitedBehaviourType": "PromptAndCloseDocument",
        "AcroJsGosBehaviorType": "PromptAndCloseDocument"
      },
      "AccessPolicyOverride": {
        "RelativeExpiryInDays": null,
        "OpenLimit": null,
        "OfflineDurationinDays": 18250,
        "IpAddressesMax": null,
        "IgnoredIpAddresses": null,
        "ExpiryInMins": 5256000,
        "DocumentLimit": 1,
        "ComputersMax": 2
      }
    }
};
//console.log(unique);
axios.request(unique).then(function(uniqueRes) {

    //console.log(uniqueRes.config);
    // inspect the data (body) of the request.
    //console.log(uniqueRes.config.data);
    // the data will be the binary of the file.
    // stream response data will be Object
    //console.log(uniqueRes.data);

    // save to local
    //console.dir(uniqueRes);
    let writer = fs.createWriteStream('unique-stream.pdf');
    console.log(uniqueRes.headers);
    let reader = uniqueRes.data;
    reader.on('data', (chunk) => {
        writer.write(new Buffer(chunk));
    });
    reader.on('end', () => {
        writer.end();
    });
}).catch(function(uniqueErr) {
    console.log('Error Response');
    //console.log(uniqueErr.config);
    console.log(uniqueErr);
});
