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

// set the stream body:
let reportQuery = {
    params: reportSettings.queryParams
};
//console.log(reportQuery);

// simple get request.
axios.get(solrEndpoint, reportQuery)
.then(function(res) {
    //console.log(res);
    //console.log(res.data.response.docs);

    let fileStream = fs.createWriteStream(reportSettings.csvFile);
    stringify(res.data.response.docs, {
        header: true,
        columns: reportSettings.csvColumns
    }).pipe(fileStream);
})
.catch(function(err) {
    console.dir(err.response.data);
});
