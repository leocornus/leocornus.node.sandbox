/**
 * quick test to generate CSV report from a Attivio query.
 */

const axios = require('axios');
const stringify = require('csv-stringify');
const strategy = require('./../../src/libs/strategy');
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
    //rows: reportSettings.queryParams.rows,
    rows: 1,
    searchProfile: "checkcity",
    //queryLanguage: "simple",
    queryLanguage: "advanced"
};
//console.log(reportQuery);

// found out the total items.
axios.post(attivioEndpoint, reportQuery)
.then(function(res) {
    //console.log(res);
    let total = res.data.totalHits;
    console.log(`Total docs found: ${total}`);

    // calculate the files needed
    let fileAmount = Math.ceil(total / reportSettings.itemsPerFile);
    console.log(`Store ${reportSettings.itemsPerFile} docs for each file`);
    console.log(`Working on generate ${fileAmount} files...`);

    strategy.waterfallOver(0, fileAmount,
        // the iterator function.
        function(index, reportDone) {

            // get ready the file name.
            let filePath = `${reportSettings.csvFile}-${index}.csv`;

            // set the query offset.
            reportQuery.offset = index * reportSettings.itemsPerFile;
            reportQuery.rows = reportSettings.itemsPerFile;

            //console.log(`report query: ${reportQuery}`);

            // query and generate the CSV file.
            axios.post(attivioEndpoint, reportQuery)
            .then(function(oneRes) {

                let payload = oneRes.data.documents.map(function(doc) {

                    // final touch for each doc.
                    return doc.fields;
                });

                console.log(`Generating file: ${filePath}`);
                let fileStream = fs.createWriteStream(filePath);
                stringify(payload, {
                    header: true,
                    columns: reportSettings.csvColumns
                }).pipe(fileStream);

                reportDone(1);
            })
            .catch(function(oneErr) {
                console.log(`Failed process ${index}`);
                console.dir(oneErr);
                // reportDone to skip.
                reportDone(1);
            });
        },
        // the completion callback.
        function() {
            console.log("All Done!");
        });

})
.catch(function(err) {
    console.dir(err.response.data);
});
