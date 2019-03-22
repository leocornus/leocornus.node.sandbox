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
const strategy = require('./../../src/libs/strategy');

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

const localConfig = config.solrCopy;

// reva endpoint.
const revaEndpoint = localConfig.baseUrl + "searchApi/search";
const targetEndPoint = localConfig.targetBaseUrl + "update/json/docs?commit=true";

// set batch size.
const batchSize = localConfig.selectRows;
console.log("From: " + revaEndpoint);
console.log("To: " + targetEndPoint);
console.log("Copy " + batchSize + " docs each time!");

// simple query to get total number:
let totalQuery = {
    workflow: "search",
    query: localConfig.selectQuery,
    rows: 1,
    searchProfile: "checkcity",
    //queryLanguage: "simple",
    queryLanguage: "advanced"
}

// simple get.
axios.post(revaEndpoint, totalQuery)
.then(function(totalRes) {

    let amount = totalRes.data.totalHits;
    console.log("Total Docs: " + amount);
    let bulk = Math.min(localConfig.endIndex, amount);
    console.log("Working on items from", localConfig.startIndex,
                "to", bulk);

    // sync interation to get docs from source 
    // batch by batch...
    //--strategy.waterfallOver(localConfig.startIndex,
    //--                       bulk, function(start, reportDone) {

    //--    axios.get(revaEndpoint, {
    //--      params: {
    //--        q: localConfig.selectQuery,
    //--        // sort to make sure we are in the same sequence 
    //--        // for each batch load.
    //--        sort: localConfig.selectSort,
    //--        rows: batchSize,
    //--        start: start
    //--      }
    //--    })
    //--    .then(function(response) {
    //--        // handle response here.
    //--        //console.log("Got Response:");
    //--        //console.dir(response.data.response.docs.length);
    //--        let payload = response.data.response.docs.map(function(doc) {

    //--            // final touch for each doc.
    //--            return localConfig.tweakDoc(doc);
    //--        });

    //--        // async call
    //--        strategy.iterateOver(payload, function(doc, report) {
    //--            axios.post(targetEndPoint, doc
    //--            ).then(function(postRes) {
    //--                //console.log("Post Success!");
    //--                report();
    //--                //console.dir(postRes);
    //--            }).catch(function(postError) {
    //--                console.log("Post Failed! - " + doc[localConfig.idField]);
    //--                //console.dir(postError.data);
    //--                // log the erorr and then report the copy is done!
    //--                report();
    //--            });
    //--        }, function() {
    //--            console.log(now() + " Async post done!");
    //--            reportDone(payload.length);
    //--        });
    //--    })
    //--    .catch(function(error) {
    //--        // handle errors here.
    //--        console.log("ERROR!");
    //--        console.dir(error);
    //--    });

    //--}, function() {
    //--    console.log(now() + " All Done");
    //--    // summary message:
    //--    let endTime = new Date();
    //--    // the differenc will be in ms
    //--    let totalTime = endTime - startTime;
    //--    console.log("Running time: " + prettyMs(totalTime));
    //--});
})
.catch(function(totalError) {
    console.log("Total Query Error!");
    console.dir(totalError);
});
