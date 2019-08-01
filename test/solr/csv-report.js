/**
 * quick test to generate CSV report from a Solr query.
 */

const axios = require('axios');
const stringify = require('csv-stringify');
const fs = require('fs');

// we using the solrCSVExport section of the local config.
const config = require('./../../src/config').solrCSVExport;
// pick the report settings
const reportSettings = config.reports[config.reportIndex];

// the update endpoint.
const solrEndpoint = reportSettings.baseUrl + "select";

// get started.
console.log(`Report endpoint: ${solrEndpoint}`);
console.log(`Output file: ${reportSettings.csvFile}`);
console.log(`Query String: ${reportSettings.queryParams.q}`);

// set the stream body:
let reportQuery = {
    params: reportSettings.queryParams
};
//console.log(reportQuery);

// simple get request.
axios.get(solrEndpoint, reportQuery)
.then(function(res) {
    //console.log(res);
    console.log('Total docs found: ' + res.data.response.numFound);

    let fileStream = fs.createWriteStream(reportSettings.csvFile);
    stringify(res.data.response.docs, {
        header: true,
        columns: reportSettings.csvColumns
    }).pipe(fileStream);
})
.catch(function(err) {
    console.dir(err.response.data);
});
