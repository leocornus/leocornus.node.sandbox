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

/**
 * try to copy every 1000,
 */
function waterfallOver(total, oneCopy, callback) {

    var doneCount = 0;
    // get started...
    oneCopy(downCount, reportDone);

    function reportDone(subTotal) {

        doneCount = doneCount + subTotal;
        console.log("Copied: " + doneCount);

        if(doneCount === total) {
            callback();
        } else {
            oneCopy(doneCount, reportDone);
        }
    }
}

/**
 * =================================================================
 * Solution Three - Correct Asynchronous read
 * 
 */
function iterateOver(docs, iterator, callback) {

    // this is the function that will start all the jobs
    // list is the collections of item we want to iterate over
    // iterator is a function representing the job when want done on each item
    // callback is the function we want to call when all iterations are over

    var doneCount = 0;  // here we'll keep track of how many reports we've got

    function report() {
        // this function resembles the phone number in the analogy above
        // given to each call of the iterator so it can report its completion

        doneCount++;

        // if doneCount equals the number of items in list, then we're done
        if(doneCount === docs.length)
            callback();
    }

    // here we give each iteration its job
    for(var i = 0; i < docs.length; i++) {
        // iterator takes 2 arguments, an item to work on and report function
        iterator(list[i], report)
    }
}
