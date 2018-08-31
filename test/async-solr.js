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
///**
// * try to copy every 1000,
// */
//function copyOver(start, oneCopy, callback) {
//
//    var doneCount = 0;
//
//    function reportDone() {
//
//        doneCount = doneCount + 100;
//
//        if(donwCount === 1000) {
//            // iterate to next 1000
//            copyOver(start + 1000, oneCopy);
//        }
//    }
//
//    function reportFinish() {
//    }
//
//    for(var i = 0; i < 1000; i = i + 100) {
//        oneCopy(start + i, reportDone, reportFinish);
//    }
//}
//
//axios.get(solrEndpoint, solrQuery)
//.then(function(response) {
//    // handle response here.
//    console.log("Got Response:");
//
//    console.dir(response.data.response.docs.length);
//
//    let payload = response.data.response.docs.map(function(doc) {
//        // set the _version_ to 0, which will overwrite existing docs.
//        // This will avoid version conflict error.
//        doc["_version_"] = 0;
//        return doc;
//    });
//
//    var endPoint =
//        config.solr.targetBaseUrl + "update/json/docs?commit=true";
//    axios.post(endPoint, payload
//    ).then(function(postRes) {
//        console.log("Post Success!");
//        //console.dir(postRes);
//    }).catch(function(postError) {
//        console.log("Post Failed!");
//        //console.dir(postError.response.data.error);
//    });
//})
//.catch(function(error) {
//    // handle errors here.
//    console.log("ERROR!");
//    console.dir(error);
//});
