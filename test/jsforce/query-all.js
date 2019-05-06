/**
 * this is a quick test to query all records in a Salesforce object.
 */

const jsforce = require('jsforce');

// get the config for jsforce.
// Make sure to get the correct section from the config file.
const config = require('./../../src/config').jsforce;

// set up the connection object.
let conn = new jsforce.Connection({
    //logLevel: "DEBUG",
    loginUrl: config.authorizationUrl
});

// log in first.
conn.login(config.username,
           config.password + config.securityToken,
           function(err, res) {

    if (err) {
        return console.error(err);
    }

    // log in success.
    console.log(res);

    // test a simple query.
    let soql = 'SELECT Id, Name FROM Account ORDER BY id LIMIT 10 OFFSET 200';
    //let soql = config.testingQuerys[config.qIndex].soql;

    // we will use the strategy to query all
    // here is the initial query.
    conn.query(soql, function(initErr, initRes) {

        console.log(initRes);
    });
});
