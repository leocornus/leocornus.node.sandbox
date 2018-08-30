/**
 */

const config = require('./../src/config');
const axios = require('axios');

// preparing the solr query.
let solrQuery = {
    params: {
      q: "*:*",
      rows: 100
    }
};

// solr endpoint.
let solrEndpoint = config.solr.baseUrl + "select";

axios.get(solrEndpoint, solrQuery)
.then(function(response) {
    // handle response here.
    console.log("Got Response:");
    console.dir(response.data.response.docs.length);
})
.catch(function(error) {
    // handle errors here.
    console.log("ERROR!");
    console.dir(error);
});
