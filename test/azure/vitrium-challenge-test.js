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
const log4js = require('log4js');
// configure log4js
log4js.configure(config.vitrium.log4jsConfig);

const Vitrium = require('./../../src/libs/vitrium');
const logger = log4js.getLogger('test');

let vitrium = new Vitrium(
    config.vitrium.accountToken,
    config.vitrium.userName,
    config.vitrium.password,
);
vitrium._initialized.then(resolve => {
    logger.info(`Vitrium session is fulfilled with token: ${resolve}`);
});
