/**
 * simple test for login.
 */

const jsforce = require('jsforce');
// the csv generator.
const csvStringify = require('csv-stringify');
const process = require('process');

const config = require('./../../src/config');

let conn = new jsforce.Connection({
    //logLevel: "DEBUG",
    loginUrl: config.jsforce.authorizationUrl
});

conn.login(config.jsforce.username, 
           config.jsforce.password + config.jsforce.securityToken,
           function(err, res) {

    if (err) {
        return console.error(err);
    }

    console.log(res);

    // test a simple query.
    //let soql = 'SELECT Id, Name FROM Account';
    let soql = config.jsforce.testingQuerys[0];

    // get more account information.
    conn.query(soql, function(err, res) {
        if (err) {
            return console.error(err);
        }
        console.log(res.records);
        csvStringify(res.records, {
            header: true
        }).pipe(process.stdout);
        //let csv = generate(res[0]);
        //console.log(csv);
    });
});
