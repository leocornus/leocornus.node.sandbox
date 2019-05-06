/**
 * this is a quick test to query all records in a Salesforce object.
 */

const jsforce = require('jsforce');

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
    let totalQuery = 'SELECT count() FROM Account';
    conn.query(totalQuery, function(totalErr, totalRes) {

        if (totalErr) {
            return console.error(totalErr);
        }

        console.log(totalRes);
        let volume = totalRes.totalSize;
        //let volume = 21;
        let batchSize = 300;

        // set the locator for next batch
        // workaround the 2000 limit.
        let locator = '';

        strategy.waterfallOver(0, volume, function(start, reportDone) {

            // build the SOQL.
            let soql = 'SELECT Id, Name FROM Account' +
                // the simple workaround to avoid 2000 limit.
                (locator === '' ? '' : " WHERE Id > '" + locator + "'") +
                ' ORDER BY Id' +
                ' LIMIT ' + batchSize +
                // Always use OFFSET as 0 to workaround 2000 limit.
                ' OFFSET 0';
            //let soql = config.testingQuerys[config.qIndex].soql;

            // we will use the strategy to query all
            // here is the initial query.
            console.log("QUERY: " + soql);
            conn.query(soql, function(oneErr, oneRes) {

                if (oneErr) {
                    return console.error(oneErr);
                }

                //console.log(oneRes.records);
                oneRes.records.forEach(function(record) {
                    console.log("id: " + record.Id + " Name: " + record.Name);
                });
                // set up locator to workaround the 2000 limit
                locator = oneRes.records[oneRes.totalSize - 1].Id;

                console.log("======== Processed: " + oneRes.totalSize);
                reportDone(oneRes.totalSize);
            });
        });
    });
});
