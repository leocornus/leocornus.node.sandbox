/**
 * This is to copy docs from Solr to Solr.
 */

const axios = require('axios');
const prettyMs = require('pretty-ms');

const strategy = require('./../../src/libs/strategy');

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

const config = require('./../../src/config');
const localConfig = config.folderFiles2Solr;

// solr endpoint.
const solrEndpoint = localConfig.baseUrl + "select";
const targetEndPoint = localConfig.targetBaseUrl + "update/json/docs?commit=true";

// the basic informaiton.
console.log("From: " + solrEndpoint);
console.log("To: " + targetEndPoint);

// simple query to get total number:
let totalQuery = {
    params: {
        q: localConfig.selectQuery,
        rows: localConfig.selectRows,
        sort: localConfig.selectSort,
        fl: localConfig.selectFieldList
    }
}

// found out the total source docs.
axios.get(solrEndpoint, totalQuery)
.then(function(totalRes) {

    let amount = totalRes.data.response.numFound;
    console.log(`Total Docs: ${amount}`);

    let docs = totalRes.data.response.docs;
    let iterator = function(index, reportOne) {
        let oneDoc = docs[index];
        console.log(oneDoc['folder_path']);
        reportOne(1);
    };
    strategy.waterfallOver(0, docs.length, iterator,
        // all complete!
        function() {
            console.log(now() + " All Done");
            // summary message:
            let endTime = new Date();
            // the differenc will be in ms
            let totalTime = endTime - startTime;
            console.log("Running time: " + prettyMs(totalTime));
        }
    );
})
.catch(function(totalErr) {

    console.log("Total Query Error!");
    console.dir(totalErr);
});
