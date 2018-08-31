/**
 */

const config = require('./../src/config');
const axios = require('axios');

// solr endpoint.
let solrEndpoint = config.solr.baseUrl + "select";

// simple query to get total number:
let totalQuery = {
    params: {
        q: "*:*",
        rows: 1,
        fl: "id"
    }
}
// simple get.
axios.get(solrEndpoint, totalQuery)
.then(function(totalRes) {

    let amount = totalRes.data.response.numFound;
    console.log("Total Docs: " + amount);

    // start from 0
    waterfallOver(amount, function(start, reportDone) {

        axios.get(solrEndpoint, {
          params: {
            q: "*:*",
            sort: "id desc",
            rows: 50,
            start: start
          }
        })
        .then(function(response) {
            // handle response here.
            //console.log("Got Response:");
        
            //console.dir(response.data.response.docs.length);
        
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
                //console.log("Post Success!");
                reportDone(payload.length);
                //console.dir(postRes);
            }).catch(function(postError) {
                console.log("Post Failed!");
                //console.dir(postError.data.response.error);
                reportDone(payload.length);
            });
        })
        .catch(function(error) {
            // handle errors here.
            console.log("ERROR!");
            console.dir(error);
        });

    }, function() {
        console.log("All Done");
    });
})
.catch(function(totalError) {
    console.log("Total Query Error!");
});

//// preparing the solr query.
//let solrQuery = {
//    params: {
//      q: "*:*",
//      //fq: "version_schema:1.0",
//      rows: 100
//      //fl: "id,c4c_type,file_content,file_hash,file_content_hash,file_size"
//    }
//};
//
/**
 * try to copy every 1000,
 */
function waterfallOver(total, oneCopy, callback) {

    var doneCount = 24950;

    function reportDone(subTotal) {

        doneCount = doneCount + subTotal;
        console.log("Copied: " + doneCount);

        if(doneCount === total) {
            callback();
        } else {
            oneCopy(doneCount, reportDone);
        }
    }

    oneCopy(24950, reportDone);
}
