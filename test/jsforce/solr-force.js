/**
 * This is to copy docs from Solr to Salesforce
 * It has two major steps:
 * - query docs, 25 rows a time, from source Solr.
 * - update values to Salesforce.
 */

const jsforce = require('jsforce');
const axios = require('axios');
const prettyMs = require('pretty-ms');

const config = require('./../../src/config').jsforce;
const strategy = require('./../../src/libs/strategy');

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

const localConfig = config.solr2Force;

// solr endpoint.
const solrEndpoint = localConfig.solrBaseUrl + "select";

// set batch size.
const batchSize = localConfig.solrSelectRows;
console.log("From: " + solrEndpoint);
console.log("Copy " + batchSize + " docs each time!");

let conn = new jsforce.Connection({
    //logLevel: "DEBUG",
    loginUrl: config.authorizationUrl
});

// simple query to get total number:
let totalQuery = {
    params: {
        q: localConfig.solrSelectQuery,
        rows: 1,
        fl: "id"
    }
}
// simple get.
axios.get(solrEndpoint, totalQuery)
.then(function(totalRes) {

    let amount = totalRes.data.response.numFound;
    console.log("Total Docs: " + amount);
    let bulk = Math.min(localConfig.endIndex, amount);
    console.log("Working on items from", localConfig.startIndex,
                "to", bulk);

    // sync interation to get docs from source 
    // batch by batch...
    strategy.waterfallOver(localConfig.startIndex,
                           bulk, function(start, reportDone) {

        axios.get(solrEndpoint, {
          params: {
            q: localConfig.solrSelectQuery,
            fl: localConfig.solrSelectFields,
            // sort to make sure we are in the same sequence 
            // for each batch load.
            sort: localConfig.solrSelectSort,
            rows: batchSize,
            start: start
          }
        })
        .then(function(response) {

            console.log("working on: " + start);
            // handle response here.
            //console.log("Got Response:");
            //console.dir(response.data.response.docs.length);
            let values = response.data.response.docs.map(function(doc) {

                // final touch for each doc.
                return localConfig.prepareValue(doc);
            });

            //console.log(values);

            conn.login(config.username,
                       config.password + config.securityToken,
                       function(err, res) {
            
                if (err) {
                    return console.error(err);
                }
            
                //console.log(res);
            
                // update some information.
                let objectName = localConfig.forceObjectName;
                conn.sobject(objectName).update(values, function(uErr, uRes) {

                    console.log(uRes);
                    //
                    reportDone(values.length);
                });
            });
        })
        .catch(function(error) {
            // handle errors here.
            console.log("ERROR!");
            console.dir(error);
        });

    }, function() {
        console.log(now() + " All Done");
        // summary message:
        let endTime = new Date();
        // the differenc will be in ms
        let totalTime = endTime - startTime;
        console.log("Running time: " + prettyMs(totalTime));
    });
})
.catch(function(totalError) {
    console.log("Total Query Error!");
    console.dir(totalError);
});
