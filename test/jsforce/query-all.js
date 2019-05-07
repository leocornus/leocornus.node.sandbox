/**
 * this is a quick test to query all records in a Salesforce object.
 *
 * There is the 2000 limit on OFFSET.
 * We have to use the workaround to iterate through all records.
 * That is how the locator is introduced.
 */

const jsforce = require('jsforce');
// using the sync api for quick test.
const csvStringify = require('csv-stringify/lib/sync');
const process = require('process');

// get the config for jsforce.
// Make sure to get the correct section from the config file.
const config = require('./../../src/config').jsforce;
const strategy = require('./../../src/libs/strategy');

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

    // find out the total records.
    // we need this query to find the amount of recores.
    let totalQuery = 'SELECT count() FROM ' + config.queryAll.objectName;
    conn.query(totalQuery, function(totalErr, totalRes) {

        if (totalErr) {
            return console.error(totalErr);
        }

        console.log(totalRes);
        let volume = totalRes.totalSize;
        //let volume = 21;
        let batchSize = config.queryAll.batchSize;

        // set the locator for next batch
        // workaround the 2000 limit.
        let locator = '';

        strategy.waterfallOver(0, volume, function(start, reportDone) {

            // build the SOQL.
            let soql = 'SELECT ' + config.queryAll.objectFields.join(",") +
                ' FROM ' + config.queryAll.objectName +
                // the simple workaround to avoid 2000 limit.
                (locator === '' ? '' : " WHERE Id > '" + locator + "'") +
                ' ORDER BY Id' +
                ' LIMIT ' + batchSize +
                // Always use OFFSET as 0 to workaround 2000 limit.
                ' OFFSET 0';
            //let soql = config.testingQuerys[config.qIndex].soql;

            // we will use the strategy to query all
            // here is the initial query.
            console.log("======== QUERY: " + soql);
            conn.query(soql, function(oneErr, oneRes) {

                if (oneErr) {
                    return console.error(oneErr);
                }

                //console.log(oneRes.records);
                console.log(csvStringify(oneRes.records, {
                    header: false,
                    columns: config.queryAll.objectFields
                }));
                //oneRes.records.forEach(function(record) {
                //    console.log("id: " + record.Id + " Name: " + record.Name);
                //    //console.log("id: " + record.Id);
                //});

                // set up locator to workaround the 2000 limit
                locator = oneRes.records[oneRes.totalSize - 1].Id;

                var done = reportDone(oneRes.totalSize);
                console.log("======== Processed: " + done);
            });
        });
    });
});
