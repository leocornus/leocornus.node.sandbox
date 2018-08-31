/**
 */

const config = require('./../src/config');
const axios = require('axios');

// preparing the solr query.
let solrQuery = {
    params: {
      q: "*:*",
      fq: "version_schema:1.0",
      rows: 100
      //fl: "id,c4c_type,file_content,file_hash,file_content_hash,file_size"
    }
};

// solr endpoint.
let solrEndpoint = config.solr.baseUrl + "select";

axios.get(solrEndpoint, solrQuery)
.then(function(response) {
    // handle response here.
    console.log("Got Response:");

    console.dir(response.data.response.docs.length);

    let payload = response.data.response.docs.map(function(doc) {
        // set the _version_ to 0, which will overwrite existing docs.
        // This will avoid version conflict error.
        doc["_version_"] = 0;
        return doc;
    });

    var endPoint =
        config.solr.targetBaseUrl + "update/json/docs?commit=true";
    axios.post(endPoint, payload
    ).then(function(postRes) {
        console.log("Post Success!");
        //console.dir(postRes);
    }).catch(function(postError) {
        console.log("Post Failed!");
        //console.dir(postError.response.data.error);
    });
})
.catch(function(error) {
    // handle errors here.
    console.log("ERROR!");
    console.dir(error);
});
