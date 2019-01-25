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

/**
 * /Verison/Unique.
 *
 * thie call need set up policy and access policy
 *
 */
async function downloadFile() {

    // get ready header;
    let headers = {
        'X-VITR-ACCOUNT-TOKEN': config.vitrium.oAccountToken,
        "X-VITR-SESSION-TOKEN": config.vitrium.oSessionToken
    };

    // get ready request.
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

    let uniqueRes = await axios.request(unique);

    //console.dir(uniqueRes);
    let writer = fs.createWriteStream('unique-sync.pdf');

    // pipe the steam to writer.
    uniqueRes.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    });
}

downloadFile();
