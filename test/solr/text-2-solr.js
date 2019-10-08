/**
 * import text file into Solr collection
 */
const axios = require('axios');
const prettyMs = require('pretty-ms');
const fs = require('fs');

const strategy = require('./../../src/libs/strategy');
// load configuration
const config = require('./../../src/config');
const localConfig = config.text2Solr;
const solrEndPoint = localConfig.solrBaseUrl + "update/json/docs?commit=true";

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

let rows = fs.readFileSync(localConfig.textFilePath).toString().split("\n");
console.log(`${now()}: Found ${rows.length} rows`);

let batchSize = localConfig.batchSize;

//var fileName = localConfig.xmlFileFolder + '/products_0001_2570_to_430420.xml';
strategy.waterfallOver(0, rows.length,
// the iterator.
// it will start with 0.
function(start, reportDone) {

    console.log(`Processing Rows: ${start} - ${start + batchSize}`);
    // slice will include begin and exclude end.
    let theRows = rows.slice(start, start + batchSize);
    reportDone(batchSize);
}, function() {

    let endTime = new Date();
    // the differenc will be in ms
    let totalTime = endTime - startTime;
    console.log("Running time: " + prettyMs(totalTime));
});
