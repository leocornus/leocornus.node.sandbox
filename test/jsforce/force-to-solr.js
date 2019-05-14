/**
 * test caset to try copy Salesforce object to Solr
 * It has two major steps:
 * - query docs, 25 rows a time, from source Solr.
 * - update values to Salesforce.
 */

const prettyMs = require('pretty-ms');
// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

const jsforce = require('jsforce');
const axios = require('axios');
// using the sync api for quick test.
const csvStringify = require('csv-stringify/lib/sync');
const process = require('process');

// get the config for jsforce.
// Make sure to get the correct section from the config file.
const config = require('./../../src/config').jsforce;
const strategy = require('./../../src/libs/strategy');
const localConfig = config.force2Solr
// set the target end point to Solr
const targetEndPoint = localConfig.solrBaseUrl + "update/json/docs?commit=true";

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
    let totalQuery = 'SELECT count() FROM ' + localConfig.objectName;
    conn.query(totalQuery, function(totalErr, totalRes) {

        if (totalErr) {
            return console.error(totalErr);
        }

        console.log(totalRes);
        let volume = totalRes.totalSize;
        //let volume = 21;
        let batchSize = localConfig.batchSize;

        // set the locator for next batch
        // workaround the 2000 limit.
        let locator = '';

        strategy.waterfallOver(0, volume, function(start, reportDone) {

            // build the SOQL.
            let soql = 'SELECT ' + localConfig.objectFields.join(",") +
                ' FROM ' + localConfig.objectName +
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

                // set up locator to workaround the 2000 limit
                locator = oneRes.records[oneRes.totalSize - 1].Id;

                // get ready the payload for Solr.
                let payloads = oneRes.records.map(function(record) {

                    // final touch for each doc.
                    return localConfig.fieldMapping(record, 
                              localConfig.objectFields);
                });

                //console.log(oneRes.records);
                //console.log(csvStringify(oneRes.records));
                //console.log(csvStringify(payloads));
                //    , {
                //    header: false,
                //    columns: localConfig.objectFields
                //}));

                // async post call
                strategy.iterateOver(payloads, function(doc, report) {
                    axios.post(targetEndPoint, doc
                    ).then(function(postRes) {
                        //console.log("Post Success!");
                        report();
                        //console.dir(postRes);
                    }).catch(function(postError) {
                        console.log("Post Failed! - " + doc[localConfig.idField]);
                        console.dir(postError.data);
                        // log the erorr and then report the copy is done!
                        report();
                    });
                }, function() {
                    console.log(now() + " Async post done!");
                    reportDone(payloads.length);
                });
            });
        }, function() {
            console.log(now() + " All Done");
            // summary message:
            let endTime = new Date();
            // the differenc will be in ms
            let totalTime = endTime - startTime;
            console.log("Running time: " + prettyMs(totalTime));
        });
    });
});
