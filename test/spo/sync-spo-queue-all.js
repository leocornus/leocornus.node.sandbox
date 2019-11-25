/**
 * This is to 
 *  - check the Solr queue 
 *  - process qualified files
 *  - update queue process status
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
const striptags = require('striptags');

const config = require('./../../src/config');
const strategy = require('./../../src/libs/strategy');

const spoAuth = require('node-sp-auth');

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

// we will re use the solrCopy configurations.
const localConfig = config.solrQueueProcess;
const spoConfig = localConfig.spo;
const tikaConfig = config.tika;

// solr endpoint.
const sourceSelect = localConfig.getSourceSelect();
const sourceUpdate = localConfig.getSourceUpdate();
const targetUpdate = localConfig.targetBaseUrl + "update/json/docs?commit=true";

// set batch size.
const batchSize = localConfig.selectRows;

console.log(now(), "Proecess Queue: " + sourceSelect);
console.log(now(), "Store file on: " + targetUpdate);
console.log(now(), "Process " + batchSize + " docs each time!");
if(localConfig.dryRun) {
    console.log(now(), "---------------- Dry Run Mode -------------------");
}

// set the headers:
let spoHeaders = {};

// get authenticated to SPO
spoAuth.getAuth(spoConfig.spoUrl, 
            {username: spoConfig.username, password: spoConfig.password})
.then(options => {

    // it only contains a cookie which will have the access token.
    //console.dir(options);

    // get ready header.
    spoHeaders = options.headers;
    //headers['Accept'] = 'application/json;odata=verbose';
    spoHeaders['Accept'] = 'application/json';

    // simple query to get total number:
    let totalQuery = {
        params: {
            q: localConfig.selectQuery,
            rows: 1,
            fl: localConfig.idField
        }
    };
    // simple get.
    axios.get(sourceSelect, totalQuery)
    .then(function(totalRes) {
    
        let amount = totalRes.data.response.numFound;
        if( amount < 1 ) {
            console.log( now() + " No doc to process..." );
            return;
        }

        console.log(now(), "Total Docs: " + amount);
        let bulk = Math.min(localConfig.endIndex, amount);
        console.log(now(), "Working on items from", localConfig.startIndex,
                    "to", bulk);

        // sync interation to get docs from source evetn queue
        // batch by batch...
        strategy.waterfallOver(localConfig.startIndex, bulk,
            batchEventsIterator,
            // the iterate over callback.
            function() {
                console.log(now(), "All Done");
                // summary message:
                let endTime = new Date();
                // the differenc will be in ms
                let totalTime = endTime - startTime;
                console.log("Running time: " + prettyMs(totalTime));
            }
        );
    })
    .catch(function(totalError) {
        console.log(now(), "Total Query Error!", totalQuery);
        if(localConfig.debugMode) console.dir(totalError);
    });

// End of spoAuth.getAuth
});

/**
 * the batch events iterator, synchornous iterator.
 */
function batchEventsIterator(start, reportDone) {

    console.log(now(), "Start to process from", start, "to", start + batchSize);
    let batchQuery = {
      params: {
        q: localConfig.selectQuery,
        // sort to make sure we are in the same sequence 
        // for each batch load.
        sort: localConfig.selectSort,
        rows: batchSize,
        start: start
      }
    };
    axios.get(sourceSelect, batchQuery)
    .then(function(response) {

        //console.dir(response.data.response.docs.length);

        //===========================================================
        // async call to iterate each doc / event
        let events = response.data.response.docs;
        strategy.iterateOver(events, eventIterator, function() {
            //===========================================================
            // End of interateOver
            console.log(now(), "Async post done", events.length);
            reportDone(events.length);
        });
    })
    .catch(function(error) {
        // handle errors here.
        console.log(now(), "Batch Query ERROR!", batchQuery);
        if(localConfig.debugMode) console.dir(error);
        // report done, using the batch size.
        // this will keep the iteration going!
        retportDone(batchSize);
    });
}

/**
 * async iterator to process each event.
 */
function eventIterator(doc, report) {

    // - get the file path
    let filePath = localConfig.getFilePath(doc, spoConfig.spoSite);
    if( filePath === null ) {

        localConfig.setupStatus(doc, "MISSING_FILE");
        reportStatus(doc);
        // report async iteration.
        report();
        return;
    }

    // process each file.
    //console.log(filePath);
    switch(localConfig.getFileFormat(filePath)) {
        case "TEXT":
            // pass the report to function, which will process one file.
            // report done once it is complete the process.
            processOneFile(doc, filePath, report);
            break;
        case "BINARY":
            processOneBinaryFile(doc, filePath, report);
            break;
        default:
            // do nothing here. Just report and iterate to next one.
            localConfig.setupStatus(doc, "SKIP_TESTING_FILE");
            reportStatus(doc);
            report();
            break;
    }
}

/**
 * utility function to report status.
 */
function reportStatus(doc) {

    if(localConfig.dryRun) {

        console.log("Report Status:", doc["process_status"]);
        return;
    }

    axios.post(sourceUpdate, doc
    ).then(function(suRes) {
        // status update success.
        //console.log("Update status successfully: " + doc.id);
    }).catch(function(suErr) {
        // failed to update status.
        if(localConfig.debugMode) console.log("Failed to update status: " + doc.id);
    });
}

/**
 * utility function to process one file a time.
 * this is for a text format file stored in SharePoint Online site.
 */
function processOneFile(eventDoc, theFile, report) {

    // process metadata from folder name.
    let meta = 
        spoConfig.extractFolderName(theFile.folder, theFile.file, theFile);

    // process one file a time.
    //console.log("Processing file: " + fileName);

    // STEP one: extract the file number and class number from file name.
    meta = Object.assign(meta, spoConfig.extractFileName(theFile.file));
    //console.log("Metadata: ", meta);

    // STEP two: get file property.
    let reqGetProp = {
        url: spoConfig.getPropertiesEndpoint(theFile),
        method: "get",
        headers: spoHeaders, 
    };
    axios.request(reqGetProp).then(function(propRes) {
        //console.dir(propRes.data);
        // extract SPO properties.
        meta = Object.assign(meta, spoConfig.extractSPOMetadata(propRes.data));
        // set the ID.
        meta['id'] = spoConfig.calcId(meta);

        //console.log("Updated metadata: ", meta);

        // STEP three: get file content. this is a text file.
        let reqGetFile = {
            url: spoConfig.getValueEndpoint(theFile),
            method: "get",
            headers: spoHeaders
        };
        axios.request(reqGetFile).then(function(fileRes) {

            meta = Object.assign(meta, spoConfig.extractContent(fileRes.data, striptags));
            postSolrDoc(eventDoc, meta, report);
        }).catch(function(fileErr) {
            // report status.
            console.log(now(), "Failed to get file content", reqGetFile);
            if(localConfig.debugMode) console.log(fileErr);
            localConfig.setupStatus(eventDoc, "DOWNLOAD_FIALED");
            reportStatus(eventDoc);
            report();
        });
    }).catch(function(propErr) {
        // report status.
        console.log(now(), "Failed to get file property", reqGetProp);
        if(localConfig.debugMode) console.log(propErr);
        localConfig.setupStatus(eventDoc, "GET_PROPERTY_FAILED");
        reportStatus(eventDoc);
        report();
    });
}

/**
 * send the solr doc to target update endpoint.
 */
function postSolrDoc(eventDoc, solrDoc, report) {

    let target = localConfig.getTargetUpdate(solrDoc);

    if(localConfig.dryRun) {
        console.log("POST File:", solrDoc[localConfig.idField], 
            "to", target);
        report();
        return;
    }

    // update Solr.
    axios.post( target, solrDoc,
        // default limit is 10MB, set to 1GB for now.
        {maxContentLength: 1073741824} )
    .then(function(postRes) {
        // update status .
        //console.log(postRes);
        localConfig.setupStatus(eventDoc, "TARGET_UPDATE_SUCCESS");
        reportStatus(eventDoc);
        report();
    }).catch(function(postErr) {
        console.log(now(), "Failed to post solr doc", solrDoc[localConfig.idField]);
        if(localConfig.debugMode) console.log(postErr);
        localConfig.setupStatus(eventDoc, "TARGET_UPDATE_FAIL");
        reportStatus(eventDoc);
        report();
    });
}

/**
 * utitlity function to process one binary file.
 */
function processOneBinaryFile(eventDoc, theFile, reportFile) {

    // get metadata from the folder.
    let meta = spoConfig.extractFolderName(theFile.folder, theFile.file, theFile);
    // check the metadata from the folder path
    //console.dir(meta);

    // TODO: check if the file exist in the target solr collection

    // query SPO to get metadata.
    let reqGetProp = {
        url: spoConfig.getPropertiesEndpoint(theFile),
        method: "get",
        headers: spoHeaders
    };
    axios.request(reqGetProp).then(function(propRes) {
        //console.dir(propRes.data);
        // extract SPO properties.
        meta = Object.assign(meta, spoConfig.extractSPOMetadata(propRes.data));
        meta = Object.assign(meta,
            spoConfig.extractSPOBinaryMetadata(propRes.data));
        // set the ID.
        meta[localConfig.idField] = spoConfig.calcId(meta);
        //console.log(meta);

    // STEP three: get file content.
        //console.log("File content:");
        let reqGetFile = {
            url: spoConfig.getValueEndpoint(theFile),
            method: "get",
            headers: spoHeaders,
            responseType: 'stream'
        };

        axios.request(reqGetFile).then(function(fileRes) {

            //console.dir(fileRes.data);
            const fileStream = fileRes.data;
            let output = fs.createWriteStream(theFile.localName);
            let md5 = crypto.createHash('md5');
            let fileSize = 0;
            fileStream.on('data', (chunk /* chunk is an ArrayBuffer */) => {

                // calculate file size.
                fileSize += chunk.length;
                // calculate MD5 has from a stream.
                md5.update(chunk);
                output.write(Buffer.from(chunk));
            });

            // handle the write end stream event.
            fileStream.on('end', () => {

                output.end();
                let fileHash = md5.digest('hex');
                //console.log('Write to file', localFile, "file hash:", fileHash);
                // index the finary file.
                indexingOneBinaryFile(eventDoc, meta, theFile.localName, 
                    fileHash, fileSize, reportFile);
                //reportFile();
            });
        })
        .catch(function(fileErr) {
            console.log("Failed to get file content:", theFile);
            if(localConfig.debugMode) console.log(fileErr);
            localConfig.setupStatus(eventDoc, "DOWNLOAD_FIALED");
            reportStatus(eventDoc);
            reportFile();
        });
    })
    .catch(function(propErr) {
        console.log("Failed to get file properties:", theFile);
        if(localConfig.debugMode) console.error(propErr);
        localConfig.setupStatus(eventDoc, "GET_PROPERTY_FAILED");
        reportStatus(eventDoc);
        reportFile();
    });
    // =======================================================================
}

/**
 * untility function to process binary file indexing.
 */
function indexingOneBinaryFile(eventDoc, fileMeta, localPath, fileHash, fileSize, reportBinary) {

    // the request to get metadata.
    let metaReq = {
        url: tikaConfig.baseUrl + 'meta/form',
        headers: {
            "Accept": "application/json",
            "Content-Type": "multipart/form-data"
        },
        formData: { file: fs.createReadStream( localPath ) } 
    };
    // form-data post to get meta data of the binary file..
    request.post( metaReq, function(metaErr, metRes, body) {

        //console.dir(body);
        //console.log("type of body: " + typeof(body));
        let tikaMeta = {};
        if(metaErr) {
            console.log('Failed to get tika metadata:', metaErr);
            // delete local file.
            deleteLocalFile(localPath);
            //
            localConfig.setupStatus(eventDoc, "TIKA_METADATA_FAILED");
            reportStatus(eventDoc);
            reportBinary();
            return;
        } else {
            try {
                tikaMeta = JSON.parse( body );
            } catch(parseError) {
                console.log('Failed to parse tikaMeta:', parseError, fileMeta);
                if(localConfig.debugMode) console.log( body );
                // catch the error and keep it going...
            }
        }

        // the request to get content text
        let tikaReq = {
            url: tikaConfig.baseUrl + 'tika/form',
            headers: {
                "Accept": "text/plain",
                "Content-Type": "multipart/form-data"
            },
            // we could not reuse the same form data object.
            // we have to create a new read stream.
            formData: {file: fs.createReadStream( localPath )}
        };
        // form-data post to get content in text format.
        request.post( tikaReq, function(err, res, body) {

            // delete local file first!
            deleteLocalFile(localPath);

            //console.dir(body);
            //console.log("type of body: " + typeof(body) );
            //console.log("Size of body: " + body.length );
            if(err) {
                console.error("Failed to parse file:", err);
                localConfig.setupStatus(eventDoc, "TIKA_PARSE_FAILED");
                reportStatus(eventDoc);
                reportBinary();
            } else {

                //=========================================================
                // get ready the payload for target collection.
                let payload = localConfig.mergeDoc( fileMeta, tikaMeta, body,
                                                    fileHash, fileSize );

                if( payload === null ) {

                    // this is an identical file, skip.
                    localConfig.setupStatus(eventDoc, "IDENTICAL_FILE");
                    reportStatus(eventDoc);

                    // report async iteration.
                    reportBinary();

                } else {

                    // post payload to target collection.
                    postSolrDoc(eventDoc, payload, reportBinary);
                }
            }
        } );
    } );
}

/**
 * utility function to remove local temp file.
 */
function deleteLocalFile(localFile) {

    if(localConfig.deleteLocal) {
        fs.unlink(localFile, (err) => {

            if(localConfig.debugMode) console.log("Delete local file: ", localFile);
        });
    } else {
        if(localConfig.debugMode) console.log("Delete local file is OFF!");
    }
}
