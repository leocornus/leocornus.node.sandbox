/**
 * simple solr copy:
 * - small amout of docs.
 * - need work on how to generate the id for target doc.
 *
 * It will use the config section:
 *  - solrSimpleCopy
 */

const axios = require('axios');
const prettyMs = require('pretty-ms');

const config = require('./../../src/config');

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

// using the simple copy section.
const localConfig = config.solrSimpleCopy;

// solr endpoint.
const solrEndpoint = localConfig.baseUrl + "select";
const targetEndPoint = localConfig.targetBaseUrl + "update/json/docs?commit=true";

axios.get(solrEndpoint, localConfig.sourceQuery)
.then(function(sourceRes) {

    // get ready target payload.
    let targetPayload = sourceRes.data.response.docs.map(function(doc) {

        // get ready the target document.
        return localConfig.prepareTargetDoc(doc);
    });

    // post target documents.
    axios.post(targetEndPoint, targetPayload)
    .then(function(postRes) {
        console.log("Post success!");
    })
    .catch(function(postError) {
        // 
        console.error("Failed to post!", postError);
    });
})
.catch(function(sourceError) {

    console.error("Failed to query source!", sourceError);
});
