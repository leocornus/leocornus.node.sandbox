/**
 * quick test to generate CSV report from a Solr query.
 */

const axios = require('axios');

// we using the solrCSVExport section of the local config.
const config = require('./../../src/config').solrCSVExport;

// the update endpoint.
const solrEndpoint = config.baseUrl + "select";

// set the stream body:
let reportQuery = {
    params: {
        q: config.report.query,
        sort: config.report.sort,
        rows: 2,
        fl: config.report.fl
    }
};

// simple get request.
axios.get(solrEndpoint, reportQuery)
.then(function(res) {
    //console.log(res);
    console.log(res.data.response.docs);
})
.catch(function(err) {
    console.log(err);
});
