/**
 * simple test case to show how to use Vitrium APIs.
 *
 * How to run the test.
 *
 *  $ cd src
 *  $ ln -s ....vitrium.js local.js // link the local.js for vitrium
 *  $ cd ..
 *  $ nvm run node test/azure/vitrium-policy-test.js
 */

const axios = require('axios');
// we should have separate local.js file for vitrium.
const config = require('./../../src/config').vitrium;

const Vitrium = require('./../../src/libs/vitrium');

let vitrium = new Vitrium(
    config.accountToken,
    config.userName,
    config.password,
);

// quick test to get all unique docs for a given doc code..
vitrium.getUniqueDocs(config.testData.docCodes[0],
                      config.testData.users[0],
                      // using the empty customField for now.
                      config.testData.customFields[0], (res, err) => {

    //console.dir(res);
    console.log(`Total docs: ${res.data.length}`);
    console.log(`unique id: ${res.data[0].Id}`);
    console.log(res.data[0]);
});

// using await wait the promise to be resolved.
async function test() {

    try {
        let copyId = await vitrium.getUniqueDocs(
                config.testData.docCodes[0],
                config.testData.users[0],
                // using the empty customField for now.
                config.testData.customFields[0]);
        
        console.log( copyId.data.length );
        console.log( `Existing unique copy id: ${copyId.data[0].Id}` );
        return copyId;
    } catch (err) {

        console.error(err);
    }
}

test()
   // .then(console.log);
