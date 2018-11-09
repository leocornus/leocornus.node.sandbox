/**
 * This is to copy docs from Solr to Solr.
 * It has two major steps:
 * - sync copy docs in batch, 25 rows a time, from source Solr.
 * - async post each doc in the batch, to the target Solr.
 *
 * STATUS:
 * - has been used for production.
 *
 * NOTES:
 * - be aware of the size of each doc!
 *   Some big size doc might disturb the copy process...
 */

const axios = require('axios');
const prettyMs = require('pretty-ms');

const config = require('./../../src/config');
const strategy = require('./../../src/strategy');

const now = () => new Date().toUTCString()

const startTime = new Date();
// solr endpoint.
const solrEndpoint = config.solr.baseUrl + "select";
const targetEndPoint = config.solr.targetBaseUrl + "update/json/docs?commit=true";
// set batch size.
const batchSize = config.solr.selectRows;
console.log("From: " + solrEndpoint);
console.log("To: " + targetEndPoint);
console.log("Copy " + batchSize + " docs each time!");

// simple query to get total number:
let totalQuery = {
    params: {
        q: config.solr.selectQuery,
        rows: 1,
        fl: "id"
    }
}
// simple get.
axios.get(solrEndpoint, totalQuery)
.then(function(totalRes) {

    let amount = totalRes.data.response.numFound;
    console.log("Total Docs: " + amount);
    amount = 5000;

    // sync interation to get docs from source 
    // batch by batch...
    strategy.waterfallOver(amount, function(start, reportDone) {

        axios.get(solrEndpoint, {
          params: {
	    q: config.solr.selectQuery,
            // sort to make sure we are in the same sequence 
            // for each batch load.
            sort: config.solr.selectSort,
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
                    console.log("Post Failed! - " + doc.sku);
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
