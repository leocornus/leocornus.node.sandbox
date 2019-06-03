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

// we should have separate local.js file for vitrium.
const config = require('./../../src/config').vitrium;

const Vitrium = require('./../../src/libs/vitrium');

let vitrium = new Vitrium(
    config.accountToken,
    config.userName,
    config.password,
);

// quick test to get all Folders.
vitrium.getUniqueDocs(config.testData.docCodes[0],
                      config.testData.users[0],
                      // using the empty customField for now.
                      config.testData.customFields[0], (res, err) => {

    //console.dir(res);
    console.log(`Total docs: ${res.data.length}`);
    console.log(`unique id: ${res.data[0].Id}`);
    console.log(res.data[0]);
});
