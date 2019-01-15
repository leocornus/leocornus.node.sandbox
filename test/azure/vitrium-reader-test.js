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
vitrium.getReaders(config.vitrium.oAccountToken,
                   config.vitrium.oSessionToken,
                   (res, err) => {

    console.log(res.data.Results.length);
    //let readers = res.data.Results.map((reader) => {
    //    // get the id, name, and createdon.
    //    return {
    //      Id: policy.Id,
    //      Name: policy.Name,
    //      CreatedOn: policy.CreatedOn
    //    };
    //});

    //console.log(policies);
});

// quick test to get all policies.
//vitrium.getReader(config.vitrium.oAccountToken,
//                  config.vitrium.oSessionToken,
//				  config.vitrium.testData.users[0],
//                  (res, err) => {
//
//    //console.log(res);
//});
