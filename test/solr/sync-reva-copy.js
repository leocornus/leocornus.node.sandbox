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
const log4js = require('log4js');

const config = require('./../../src/config');
const strategy = require('./../../src/libs/strategy');

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

const localConfig = config.solrCopy;
// configure log4js
log4js.configure(localConfig.log4jsConfig);

// reva endpoint.
const revaEndpoint = localConfig.baseUrl + "searchApi/search";
const targetEndPoint = localConfig.targetBaseUrl + "update/json/docs?commit=true";

// set batch size.
const batchSize = localConfig.selectRows;
// if the category is not exist, the default category will be used.
const logger = log4js.getLogger('test');

logger.info("From: " + revaEndpoint);
logger.info("To: " + targetEndPoint);
logger.info("Copy " + batchSize + " docs each time!");

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
    logger.info("Total Docs: " + amount);
    let bulk = Math.min(localConfig.endIndex, amount);
    logger.info("Working on items from", localConfig.startIndex,
                "to", bulk);

    // sync interation to get docs from source 
    // batch by batch...
    strategy.waterfallOver(localConfig.startIndex,
                           bulk, function(start, reportDone) {

        axios.post(revaEndpoint, {
          workflow: "search",
          query: localConfig.selectQuery,
          rows: batchSize,
          offset: start,
          sort: localConfig.selectSort,
          searchProfile: "checkcity",
          //queryLanguage: "simple",
          queryLanguage: "advanced"
        })
        .then(function(response) {
            // handle response here.
            //logger.info("Got Response:");
            //console.dir(response.data.response.docs.length);
            let payload = response.data.documents.map(function(doc) {

                // final touch for each doc.
                return localConfig.tweakDoc(doc.fields);
            });

            // async call
            strategy.iterateOver(payload, function(doc, report) {
                axios.post(targetEndPoint, doc
                ).then(function(postRes) {
                    //logger.info("Post Success!");
                    report();
                    //console.dir(postRes);
                }).catch(function(postError) {
                    logger.error("Post Failed! - " + doc[localConfig.idField]);
                    //console.dir(postError.data);
                    // log the erorr and then report the copy is done!
                    report();
                });
            }, function() {
                logger.info("Async post done!");
                reportDone(payload.length);
            });
        })
        .catch(function(error) {
            // handle errors here.
            logger.error("ERROR!");
            console.dir(error);
        });

    }, function() {
        logger.info("All Done");
        // summary message:
        let endTime = new Date();
        // the differenc will be in ms
        let totalTime = endTime - startTime;
        logger.info("Running time: " + prettyMs(totalTime));
    });
})
.catch(function(totalError) {
    logger.info("Total Query Error!");
    console.dir(totalError);
});
