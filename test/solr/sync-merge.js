/**
 * This is to copy docs from Solr to Solr.
 * It has two major steps:
 * - sync copy docs in batch, 25 rows a time, from source Solr.
 * - merge the content of each doc from select solr to target solr.
 * - fields should be picked in method mergeDoc
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

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

// we will re use the solrCopy configurations.
const localConfig = config.solrCopy;

// solr endpoint.
const solrEndpoint = localConfig.baseUrl + "select";
const targetEndPoint = localConfig.targetBaseUrl + "update/json/docs?commit=true";

// set batch size.
const batchSize = localConfig.selectRows;
console.log("From: " + solrEndpoint);
console.log("To: " + targetEndPoint);
console.log("Merge " + batchSize + " docs each time!");

// simple query to get total number:
let totalQuery = {
    params: {
        q: localConfig.selectQuery,
        rows: 1,
        fl: localConfig.idField
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
            q: localConfig.selectQuery,
            // sort to make sure we are in the same sequence 
            // for each batch load.
            sort: localConfig.selectSort,
            rows: batchSize,
            start: start
          }
        })
        .then(function(response) {
            // handle response here.
            //console.log("Got Response:");
            //console.dir(response.data.response.docs.length);
            // async call to iterate each doc.
            let payload = response.data.response.docs;
            strategy.iterateOver(payload,
            function(doc, report) {
                // preparying the query.
                let query = {
                  params: {
                    q: `${localConfig.idField}:${doc[localConfig.idField]}`
                  }
                };
                // inspect query.
                //console.log(query);
                // query the matched doc.
                axios.get(localConfig.targetBaseUrl + "select", query)
                .then(function(res) {

                    // merge docs to one doc.
                    let theDoc = localConfig.mergeDoc(res.data.response.docs[0], 
                                                      doc);
                    //console.dir(theDoc);
                    // post to target.
                    axios.post(targetEndPoint, theDoc
                    ).then(function(postRes) {
                        //console.log("Post Success!");
                        report();
                        //console.dir(postRes);
                    }).catch(function(postError) {
                        console.log("Post Failed! - " + theDoc[localConfig.idField]);
                        //console.dir(postError);
                        // log the erorr and then report the copy is done!
                        report();
                    });
                })
                .catch(function(err) {
                    console.log("Query Failed! - " + doc[localConfig.idField]);
                    report();
                });
            }, function() {
                console.log(now() + " Async post done!");
                reportDone(payload.length);
            });

            /**
             * ====================================================================
             * the Promise.all try is not working yet.
             * we will come back later.
            let promises = response.data.response.docs.map(localConfig.mergeDoc);
            Promise.all(promises).then((payload) => {

                // async call
                strategy.iterateOver(payload, function(doc, report) {
                    axios.post(targetEndPoint, doc
                    ).then(function(postRes) {
                        //console.log("Post Success!");
                        report();
                        //console.dir(postRes);
                    }).catch(function(postError) {
                        console.log("Post Failed! - " + doc[localConfig.idField]);
                        //console.dir(postError.data);
                        // log the erorr and then report the copy is done!
                        report();
                    });
                }, function() {
                    console.log(now() + " Async post done!");
                    reportDone(payload.length);
                });
            }).catch((error) => {
                console.log("Promise Error");
                console.log(error);
            });
             * =====================================================================
             */
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
//      //fl: "id,c4c_type,file_content,filehash,file_content_hash,file_size"
//    }
//};
