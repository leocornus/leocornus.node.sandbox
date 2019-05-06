/**
 * simple test to login and execute a simple SOQL query.
 * We also produce a csv file from the query results
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

    // test a simple query.
    //let soql = 'SELECT Id, Name FROM Account';
    let soql = config.testingQuerys[config.qIndex].soql;

    // get more account information.
    conn.query(soql, function(err, res) {

        if (err) {
            return console.error(err);
        }

        console.log(res);
        /**
         * here are the response data structure:
         * { 
         *     totalSize: 10482,
         *     done: false,
         *     nextRecordsUrl: '/services/data/v42.0/query/01g5500000PI2d6AAD-2000',
         *     records: []
         * }
         *
         * the nextRecordsUrl will be the locator for method queryMore.
         */

        // the file stream
        var fileStream = fs.createWriteStream('/tmp/test.csv');

        //console.log(res.records);
        csvStringify(res.records, {
            header: true,
            columns: config.testingQuerys[config.qIndex].csvColumns
        })
        // pipe the stream to stdout.
        //.pipe(process.stdout);
        // pipe the stream to a file.
        .pipe(fileStream);
    });
});
