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
vitrium.getPolicies(config.vitrium.oAccountToken,
                    config.vitrium.oSessionToken,
                    (res, err) => {

    //console.log(res);
    let policies = res.data.Results.map((policy) => {
        // get the id, name, and createdon.
        return {
          Id: policy.Id,
          Name: policy.Name,
          CreatedOn: policy.CreatedOn
        };
    });

    console.log(policies);
});
