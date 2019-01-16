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
const config = require('./../../src/config');

const vitrium = require('./../../src/libs/vitrium');

// quick test to get all policies.
vitrium.getFolders(config.vitrium.oAccountToken,
                config.vitrium.oSessionToken,
                1, 15,
                (res, err) => {

    console.log(res.data.Results.length);
});
