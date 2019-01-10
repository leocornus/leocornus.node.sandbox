/**
 * simple test case to show how to use Vitrium APIs.
 *
 * How to run the test.
 *
 *  $ cd src
 *  $ ln -s ....vitrium.js local.js // link the local.js for vitrium
 *  $ cd ..
 *  $ nvm run node test/azure/vitrium-challenge-test.js
 */

// we should have separate local.js file for vitrium.
const config = require('./../../src/config');

const vitrium = require('./../../src/libs/vitrium');

// estabilish security session
vitrium.estabilishSession(config.vitrium.accountToken,
                          config.vitrium.sessionToken,
                          config.vitrium.userName,
                          config.vitrium.password,
                          (headers, err) => {

    console.log(headers);
});
