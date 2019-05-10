/**
 * simple test to login and execute a simple SOQL query.
 * We also produce a csv file from the query results
 *
 * - testing simple query, using SOQL
 * - export the search results on CSV format
 */

const jsforce = require('jsforce');
// the csv generator.
const csvStringify = require('csv-stringify');
const process = require('process');
const fs = require('fs');

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

    // describe an object.
    conn.describe('Account', function(descErr, descRes) {

        if (descErr) {
            return console.error(descErr);
        }
        
        console.log(descRes.fields[0]);

        descRes.fields.forEach(field => {

            console.log(field.name);
        });

        console.log("There are " + descRes.fields.length + " fields");

        // try to get the command line parameters from process.
        process.argv.forEach(arg => {
            console.log(arg);
        });
    });
});
