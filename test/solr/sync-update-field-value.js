/**
 * This is a test case to change the value of a field in Solr index
 * It has two major steps:
 * - sync read docs in batch, 25 rows a time, from source Solr.
 * - async post each doc in the batch, to the same Solr.
 *
 * STATUS:
 * - has been used for production.
 *
 * NOTES:
 * - be aware of the size of each doc!
 *   Some big size doc might disturb the change process...
 */

const axios = require('axios');
// use this lib to show time range.
const prettyMs = require('pretty-ms');

const config = require('./../../src/config');
const strategy = require('./../../src/libs/strategy');

// using UTC for the logging message.
const now = () => new Date().toUTCString()

const startTime = new Date();
// solr endpoint.
const solrEndpoint = config.solrChange.baseUrl + "select";
// we are working on the save Solr collection.
const targetEndPoint = config.solrChange.baseUrl + "update/json/docs?commit=true";
// set batch size.
const batchSize = config.solrChange.selectRows;
console.log("From: " + solrEndpoint);
console.log("To: " + targetEndPoint);
console.log("Change " + batchSize + " docs each time!");

// simple query to get total number:
let totalQuery = {
    params: {
        q: config.solrChange.selectQuery,
        rows: 1,
        fl: config.solrChange.idField
    }
}
// simple get.
axios.get(solrEndpoint, totalQuery)
.then(function(totalRes) {

    let amount = totalRes.data.response.numFound;
    console.log("Total Docs: " + amount);
    let bulk = Math.min(config.solrChange.endIndex, amount);
    console.log("Working on items from", config.solrChange.startIndex,
                "to", bulk);

    // sync interation to get docs from source 
    // batch by batch...
    strategy.waterfallOver(config.solrChange.startIndex,
                           bulk, function(start, reportDone) {

        axios.get(solrEndpoint, {
          params: {
            q: config.solrChange.selectQuery,
            // sort to make sure we are in the same sequence 
            // for each batch load.
            sort: config.solrChange.selectSort,
            rows: batchSize,
            start: start
          }
        })
        .then(function(response) {
            // handle response here.
            //console.log("Got Response:");
            //console.dir(response.data.response.docs.length);
            let payload = response.data.response.docs.map(function(doc) {
                // set the _version_ to 0, which will overwrite existing docs.
                // This will avoid version conflict error.
                doc["_version_"] = 0;
                doc = config.solrChange.updateTheDoc(doc);
                return doc;
            });

            // async call
            strategy.iterateOver(payload, function(doc, report) {
                axios.post(targetEndPoint, doc
                ).then(function(postRes) {
                    //console.log("Post Success!");
                    report();
                    //console.dir(postRes);
                }).catch(function(postError) {
                    console.log("Post Failed! - " + doc[config.solrChange.idField]);
                    //console.dir(postError.data);
                    // log the erorr and then report the copy is done!
                    report();
                });
            }, function() {
                console.log(now() + " Async post done!");
                reportDone(payload.length);
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

//// preparing the solr query.
//let solrQuery = {
//    params: {
//      q: "*:*",
//      //fq: "version_schema:1.0",
//      rows: 100
//      //fl: "id,c4c_type,file_content,file_hash,file_content_hash,file_size"
//    }
//};
