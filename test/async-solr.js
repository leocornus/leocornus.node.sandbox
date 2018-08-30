/**
 */

const config = require('./../src/config');
const axios = require('axios');

// preparing the solr query.
let solrQuery = {
    params: {
      q: "*:*",
      rows: 100,
      fl: "id,c4c_type,file_content,file_hash,file_content_hash,file_size"
    }
};

// solr endpoint.
let solrEndpoint = config.solr.baseUrl + "select";

axios.get(solrEndpoint, solrQuery)
.then(function(response) {
    // handle response here.
    console.log("Got Response:");

    console.dir(response.data.response.docs.length);

    var endPoint =
        config.solr.targetBaseUrl + "update/json/docs?commit=true";
    axios.post(endPoint, response.data.response.docs 
    ).then(function(postRes) {
        console.dir(postRes);
    }).catch(function(postError) {
        console.log(postError);
    });
})
.catch(function(error) {
    // handle errors here.
    console.log("ERROR!");
    console.dir(error);
});
