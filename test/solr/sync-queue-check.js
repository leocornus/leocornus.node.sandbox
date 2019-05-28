/**
 * This is to check the Solr queue and / maybe update queue process status
 *
 * NOTES:
 * - be aware of the size of each doc!
 *   Some big size doc might disturb the copy process...
 */

const axios = require('axios');
const prettyMs = require('pretty-ms');

const config = require('./../../src/config');
const strategy = require('./../../src/libs/strategy');

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

// we will re use the solrCopy configurations.
const localConfig = config.solrQueueCheck;

// solr endpoint.
const sourceSelect = localConfig.baseUrl + "select";
const sourceUpdate = localConfig.baseUrl + "update/json/docs?commit=true";

// set batch size.
const batchSize = localConfig.selectRows;
console.log("Checking: " + sourceSelect);
console.log("Process " + batchSize + " docs each time!");

// simple query to get total number:
let totalQuery = {
    params: {
        q: localConfig.selectQuery,
        rows: 1,
        fl: localConfig.idField
    }
}
// simple get.
axios.get(sourceSelect, totalQuery)
.then(function(totalRes) {

    let amount = totalRes.data.response.numFound;
    console.log("Total Docs: " + amount);
    let bulk = Math.min(localConfig.endIndex, amount);
    console.log("Working on items from", localConfig.startIndex,
                "to", bulk);

    // sync interation to get docs from source 
    // batch by batch...
    strategy.waterfallOver(localConfig.startIndex,
                           bulk, function(start, reportDone) {

        axios.get(sourceSelect, {
          params: {
            q: localConfig.selectQuery,
            // sort to make sure we are in the same sequence 
            // for each batch load.
            sort: localConfig.selectSort,
            rows: batchSize,
            start: start
          }
        })
        .then(function(response) {
            // handle response here.
            //console.log("Got Response:");
            //console.dir(response.data.response.docs.length);

            // async call to iterate each doc / event
            let payload = response.data.response.docs;
            strategy.iterateOver(payload,
            function(doc, report) {
                // brief steps:
                // - get the file path on Azure
                // - download file
                // - calculate MD5 hash
                // - compare the md5 hash
                // - setup process status based on the compare result.
                // - update process status.
                // - call report for ineration.

                // - update source to processing
                delete doc["_version_"];
                delete doc["_modified_"];
                doc["process_status"] = "processing";
                doc["process_message"] = "start processing";
                axios.post(sourceUpdate, doc
                ).then(function(suRes) {
                    // source update response.

                    // - copy metada to target
                    // preparying the query to search target.
                    let query = {
                      params: {
                        q: `${localConfig.idField}:"${doc[localConfig.idField]}"`
                      }
                    };
                    // inspect query.
                    //console.log(query);

                    // query the matched doc in target collection
                    axios.get(targetSelect, query)
                    .then(function(res) {

                        // we found the doc with same id
                        // merge docs to one doc.
                        mergeExistingDoc(res.data.response.docs[0], 
                                         doc, report);
                    }).catch(function(err) {

                        console.log("Query Failed! - " +
                                    doc[localConfig.idField]);
                        // create new doc.
                        createNewDoc(doc, report);
                    });
                }).catch(function(suErr) {

                });
                // - if success update status to metadata processing done
                // - if fail update status to metadata processing failed

            }, function() {
                console.log(now() + " Async post done!");
                reportDone(payload.length);
            });
        })
        .catch(function(error) {
            // handle errors here.
            console.log("Batch Query ERROR!");
            console.dir(error);
        });

    }, function() {
        console.log(now() + " All Done");
        // summary message:
        let endTime = new Date();
        // the differenc will be in ms
        let totalTime = endTime - startTime;
        console.log("Running time: " + prettyMs(totalTime));
    });
})
.catch(function(totalError) {
    console.log("Total Query Error!");
    console.dir(totalError);
});

/**
 * merge existing doc.
 */
function mergeExistingDoc(targetDoc, sourceDoc, report) {

    let theDoc = localConfig.mergeDoc(targetDoc, sourceDoc);
    //console.dir(theDoc);
    if(theDoc === null) {
        // target has the source content!
        // skip it!
        console.log(`No metadata change! Skip - ${sourceDoc[localConfig.idField]}`);
        report();

        sourceDoc['process_status'] = 'skip-metadata';
        sourceDoc['process_message'] = 'No metadata change, skip';
        // update the source document, process status and
        // process message.
        axios.post(sourceUpdate, sourceDoc
        ).then(function(skipRes) {

        }).catch(function(su1Err) {

        });
    } else {
        // post to target. update the target doc
        axios.post(targetUpdate, theDoc
        ).then(function(postRes) {
            //console.log("Post Success!");
            report();

            //console.dir(postRes);
            sourceDoc['process_status'] = 'success-metadata';
            sourceDoc['process_message'] = 'Metadata process success';
            // update the source document, process status and
            // process message.
            axios.post(sourceUpdate, sourceDoc
            ).then(function(su1Res) {

            }).catch(function(su1Err) {

            });
        }).catch(function(postError) {
            console.log("Post Failed! - " + theDoc[localConfig.idField]);
            //console.dir(postError);
            // log the erorr and then report the copy is done!
            report();
            sourceDoc['process_status'] = 'failed-metadata-post';
            sourceDoc['process_message'] = 'Metadata process Failed! - Post failed';
            // update the source document.
            axios.post(sourceUpdate, sourceDoc
            ).then(function(su2Res) {

            }).catch(function(su2Err) {

            });
        });
    }
}

/**
 * create new doc.
 */
function createNewDoc(sourceDoc, report) {

    let theDoc = localConfig.createDoc(sourceDoc);
    //console.dir(theDoc);
    // post to target. update the target doc
    axios.post(targetUpdate, theDoc
    ).then(function(postRes) {
        console.log("Create new doc: " + theDoc[localConfig.idField]);
        report();

        //console.dir(postRes);
        sourceDoc['process_status'] = 'success-create-metadata';
        sourceDoc['process_message'] = 'Metadata created successfully';
        // update the source document, process status and
        // process message.
        axios.post(sourceUpdate, sourceDoc
        ).then(function(su1Res) {

        }).catch(function(su1Err) {

        });
    }).catch(function(postError) {
        console.log("Post Failed! - " + theDoc[localConfig.idField]);
        //console.dir(postError);
        // log the erorr and then report the copy is done!
        report();

        sourceDoc['process_status'] = 'failed-metadata-post';
        sourceDoc['process_message'] = 'Metadata process Failed! - Post failed';
        // update the source document.
        axios.post(sourceUpdate, sourceDoc
        ).then(function(su2Res) {

        }).catch(function(su2Err) {

        });
    });
}
