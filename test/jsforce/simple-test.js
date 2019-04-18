/**
 * simple test for login.
 */

const jsforce = require('jsforce');

const config = require('./../../src/config');

let conn = new jsforce.Connection({
    logLevel: "DEBUG",
    loginUrl: config.jsforce.authorizationUrl
});

conn.login(config.jsforce.username, 
           //config.jsforce.password,
           config.jsforce.password + config.jsforce.securityToken,
           //config.jsforce.securityToken,
           function(err, res) {

    if (err) {
        return console.error(err);
    }

    // get more account information.
    conn.query('SELECT Id, Name FROM Account', function(err, res) {
        if (err) {
            return console.error(err);
        }
        console.log(res);
    });
});
