/**
 * This is to check the Solr queue and / maybe update queue process status
 *
 * NOTES:
 * - be aware of the size of each doc!
 *   Some big size doc might disturb the copy process...
 */

const axios = require('axios');
const request = require('request');
const prettyMs = require('pretty-ms');
const fs = require('fs');
const crypto = require('crypto');
const azure = require('azure-storage');

const config = require('./../../src/config');
const strategy = require('./../../src/libs/strategy');

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

// we will re use the solrCopy configurations.
const localConfig = config.solrQueueProcess;
const azureConfig = config.azure;
const tikaConfig = config.tika;

// solr endpoint.
const sourceSelect = localConfig.baseUrl + "select";
const sourceUpdate = localConfig.baseUrl + "update/json/docs?commit=true";
const targetSelect = localConfig.targetBaseUrl + "select";
const targetUpdate = localConfig.targetBaseUrl + "update/json/docs?commit=true";

// set batch size.
const batchSize = localConfig.selectRows;

console.log("Proecess Queue: " + sourceSelect);
console.log("Store file on: " + targetUpdate);
console.log("Process " + batchSize + " docs each time!");

let fileService = azure.createFileService(azureConfig.storageAccount,
                                          azureConfig.storageAccessKey);

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

            //===========================================================
            // async call to iterate each doc / event
            let payload = response.data.response.docs;
            strategy.iterateOver(payload,
            function(doc, report) {
                // brief steps:
                // - get the file path on Azure
                let filePath = localConfig.getFilePath(doc);

                // - download file
                // - compare the md5 hash
                // - setup process status based on the compare result.
                // - update process status.
                // - call report for ineration.
                fileService.getFileToStream(azureConfig.storageFileShare,
                    filePath.folder, filePath.file,
                    fs.createWriteStream(filePath.localName),
                    function(error, result, response) {

                        if (!error) {
                            // got the file.
                            // - calculate MD5 hash
                            var hash = crypto.createHash('md5');
                            var s = fs.ReadStream(filePath.localName);
                            s.on('data', function(theData) {
                                hash.update(theData);
                            });

                            s.on('end', function() {
                                var d = hash.digest('hex');
                                //console.log(d + '  ' + filePath.localName);

                                // query target colleciton.
                                let targetQuery = {
                                    params: {
                                        //fl: 'file_hash',
                                        q: `${localConfig.idField}:"${doc[localConfig.idField]}"`
                                    }
                                };
                                axios.get( targetSelect, targetQuery )
                                .then( function( matchRes ) {

                                    // found the match. check the file hash.
                                    let matchDoc = matchRes.data.response.docs[0];
                                    indexingFile(matchDoc, filePath.localName, d, doc, report);
                                } ).catch( function( matchErr ) {

                                    // failed to find match!
                                    // log mismatch and terminate the process.
                                    console.log( "Target query failed! - " +
                                                 doc[localConfig.idField] );
                                    doc["process_status"] = "missing_id_skip";
                                    doc["process_message"] = "Skip because of product not exist in main schema";
                                    reportStatus(doc);

                                    // report the async iteration
                                    report();
                                } );
                            });
                        } else {
                            // failed to download file.
                            // update process status and message.
                            // call report.
                            doc["process_status"] = "download_failed";
                            doc["process_message"] = "Failed to download file!";
                            console.log("Failed to download: " + doc[localConfig.idField]);
                            reportStatus(doc);

                            // report the async iteration
                            report();
                        }
                    }
                );
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
 * report status.
 */
function reportStatus(doc) {

    // - update source to processing
    delete doc["_version_"];
    delete doc["_modified_"];

    axios.post(sourceUpdate, doc
    ).then(function(suRes) {
        // status update success.
        //console.log("Update status successfully: " + doc.id);
    }).catch(function(suErr) {
        // failed to update status.
        console.log("Failed to update status: " + doc.id);
    });
}

/**
 * process file indexing.
 */
function indexingFile(targetDoc, fullPath, md5Hash, eventDoc, report) {

    // the request to get metadata.
    let metaReq = {
        url: tikaConfig.baseUrl + 'meta/form',
        headers: {
            "Accept": "application/json",
            "Content-Type": "multipart/form-data"
        },
        formData: { file: fs.createReadStream( fullPath ) } 
    };

    // form-data post to get meta data.
    request.post( metaReq, function(metErr, metRes, body) {

        //console.dir(body);
        //console.log("type of body: " + typeof(body));
        let metadata = JSON.parse( body );

        // the request to get content text
        let tikaReq = {
            url: tikaConfig.baseUrl + 'tika/form',
            headers: {
                "Accept": "text/plain",
                "Content-Type": "multipart/form-data"
            },
            // we could not reuse the same form data object.
            // we have to create a new read stream.
            formData: {file: fs.createReadStream( fullPath )}
        };
        // form-data post to get content in text format.
        request.post( tikaReq, function(err, res, body) {

            //console.dir(body);
            //console.log("type of body: " + typeof(body) );
            //console.log("Size of body: " + body.length );

            //=========================================================
            // get ready the payload for target collection.
            let payload = localConfig.mergeDoc( targetDoc, metadata, body,
                                                md5Hash, eventDoc );

            if( payload === null ) {
                // this is an identical file, skip.
                eventDoc["process_status"] = "same_hash_skip";
                eventDoc["process_message"] = "Skip because of same MD5 hash";
                reportStatus(eventDoc);

                // report async iteration.
                report();
            } else {

                // post payload to target collection.
                axios.post( targetUpdate, payload )
                .then(function(postRes) {
                    //console.log("Post Success!");

                    //console.dir(postRes);
                    eventDoc['process_status'] = 'Reindex_success';
                    eventDoc['process_message'] = 'Successfully reindex';
                    // update the source document, process status and
                    // process message.
                    reportStatus(eventDoc);

                    // report async iteration.
                    report();
                }).catch(function(postError) {
                    console.log("Post Failed! - " + targetDoc[localConfig.idField]);
                    //console.dir(postError);

                    // log the erorr and then report the copy is done!
                    eventDoc['process_status'] = 'Reindex_failed';
                    eventDoc['process_message'] = 'Metadata process Failed! - Post failed';
                    // update the source document.
                    reportStatus(eventDoc);

                    // report async iteration.
                    report();
                });
            }
        } );
    } );
}
