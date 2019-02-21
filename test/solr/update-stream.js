/**
 * quick test the update stream.body endpoint.
 */

const axios = require('axios');

const config = require('./../../src/config');

const localConfig = config.solrStream;

// the update endpoint.
const solrEndpoint = localConfig.baseUrl + "update";

// set the stream body:
let streamBody = {
    params: {
        "stream.body": `<delete><query>${localConfig.deleteQuery}</query></delete>`,
        "commit": true
    }
};

// simple get request.
axios.get(solrEndpoint, streamBody)
.then(function(res) {
    console.log(res);
})
.catch(function(err) {
    console.log(err);
});
