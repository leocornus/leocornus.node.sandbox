/**
 * quick test to generate CSV report from a Attivio query.
 */

const axios = require('axios');
const stringify = require('csv-stringify');
const fs = require('fs');

// we using the solrCSVExport section of the local config.
const config = require('./../../src/config').attivioCSVExport;
// pick the report settings
const reportSettings = config.reports[config.reportIndex];

// the update endpoint.
const attivioEndpoint = reportSettings.baseUrl + "searchApi/search";

// get started.
console.log(`Report endpoint: ${attivioEndpoint}`);
console.log(`Output file: ${reportSettings.csvFile}`);
console.log(`Query String: ${reportSettings.queryParams.q}`);

// set the stream body:
let reportQuery = {
    workflow: "search",
    query: reportSettings.queryParams.q,
    sort: reportSettings.queryParams.sort,
    offset: reportSettings.queryParams.start,
    rows: reportSettings.queryParams.rows,
    searchProfile: "checkcity",
    //queryLanguage: "simple",
    queryLanguage: "advanced"
};
//console.log(reportQuery);

// simple get request.
axios.post(attivioEndpoint, reportQuery)
.then(function(res) {
    //console.log(res);
    console.log('Total docs found: ' + res.data.totalHits);

    let payload = res.data.documents.map(function(doc) {

        // final touch for each doc.
        return doc.fields;
    });

    let fileStream = fs.createWriteStream(reportSettings.csvFile);
    stringify(payload, {
        header: true,
        columns: reportSettings.csvColumns
    }).pipe(fileStream);
})
.catch(function(err) {
    console.dir(err.response.data);
});
