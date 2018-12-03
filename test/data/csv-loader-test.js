/**
 * test case to load data from csv file.
 */

const config = require('./../../src/config');
const d3 = require("d3");

// polyfill for Fetch API,
// as explained in issue: https://github.com/d3/d3-fetch/issues/19
if (typeof fetch !== 'function') {
    global.fetch = require('node-fetch-polyfill');
}

d3.csv(config.csvLoader.csvFile,
       // the first parameter is a row,
       // the second parameter is the index, starts from 0
       function(d, index) {
          // Here, we could tweak the data columns and values.
          //console.log(d["Account Name"]);
          // we will process row by row.
          //console.log("index = " + index);
          //return d;
          var newRow = config.csvLoader.updateRow(d);

          // send payload to Solr for every row is very costy!
          // the better way is group a set of rows (for example 1000) to
          // send at one time.
          //self.postPayload(newRow);
          return newRow;
        }
).then(function(data) {
    console.log(data);
    //self.inputText = JSON.stringify(data[100],null, 2);
    //self.postPayload(data[100]);
    while(data.length > 0) {
      var rows = [];
      // the method splice will remove records and return them as
      // a new array
      rows = data.splice(0, 500);
      //console.log(rows);
      //self.postPayload(rows);
    }
});

