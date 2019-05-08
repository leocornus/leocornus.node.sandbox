/**
 * JSforce supports basic "CRUD" operation for records in Salesforce.
 * It also supports multiple record manipulation in one API call.
 *
 * - testing simple update
 */

const jsforce = require('jsforce');

// get the config for jsforce.
// Make sure to get the correct section from the config file.
const config = require('./../../src/config').jsforce;

let conn = new jsforce.Connection({
    //logLevel: "DEBUG",
    loginUrl: config.authorizationUrl
});

conn.login(config.username,
           config.password + config.securityToken,
           function(err, res) {

    if (err) {
        return console.error(err);
    }

    console.log(res);

    // get more account information.
    conn.query(config.crudTest.queryObject, function(err, res) {

        if (err) {
            return console.error(err);
        }

        console.log(res);
    });
});
