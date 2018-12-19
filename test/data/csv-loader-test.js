/**
 * test case to load data from csv file.
 */

const config = require('./../../src/config');
const d3 = require("d3");
const strategy = require('./../../src/strategy');
const prettyMs = require('pretty-ms');
const axios = require('axios');

// logging message timestamp.
const now = () => new Date().toUTCString()
const startTime = new Date();

// polyfill for Fetch API,
// as explained in issue: https://github.com/d3/d3-fetch/issues/19
if (typeof fetch !== 'function') {
    global.fetch = require('node-fetch-polyfill');
}

const localConfig = config.csvLoader;

var csvData = [];

// update end point.
const solrEndPoint = localConfig.solrUpdateBase + "update/json/docs?commit=true";

d3.csv(localConfig.csvFile,
       // the first parameter is a row,
       // the second parameter is the index, starts from 0
       function(d, index) {
          // Here, we could tweak the data columns and values.
          //console.log(d["Account Name"]);
          // we will process row by row.
          //console.log("index = " + index);
          //return d;
          var newRow = localConfig.updateRow(d);

          // send payload to Solr for every row is very costy!
          // the better way is group a set of rows (for example 1000) to
          // send at one time.
          //self.postPayload(newRow);
          return newRow;
        }
).then(function(data) {
    console.log(`total rows: ${data.length}`);
    //console.log(data[0]);
    console.log(`columns: ${data.columns}`);
    //self.inputText = JSON.stringify(data[100],null, 2);
    //self.postPayload(data[100]);
    csvData = data;

    let total = Math.min(localConfig.endIndex, data.length);
    // waterfall over
    strategy.waterfallOver(localConfig.startIndex,
                           total, processOneLoad, function () {

        console.log(now() + " All Done");
        // summary message:
        let endTime = new Date();
        // the differenc will be in ms
        let totalTime = endTime - startTime;
        console.log("Running time: " + prettyMs(totalTime));
    });
});

/**
 * process one group
 */
function processOneLoad(start, reportDone) {

    var rows = [];
    // the method slice will return the subset of data and
    // not change the original array.
    // a new array
    rows = csvData.slice(start, start + localConfig.solrUpdateBatch);

    strategy.iterateOver(rows, function(doc, report) {

        axios.post(solrEndPoint, doc
        ).then(function(postRes) {
            //console.log("Post Success!");
            report();
            //console.dir(postRes);
        }).catch(function(postError) {
            console.log("Post Failed! - " + doc[localConfig.idField]);
            //console.dir(postError);
            // log the erorr and then report the copy is done!
            report();
        });
    }, function() {
        console.log(now() + " Async post done!");
        reportDone(localConfig.solrUpdateBatch);
    });
}
