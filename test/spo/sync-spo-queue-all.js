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
const spoConfig = config.spo;
const tikaConfig = config.tika;

// solr endpoint.
const sourceSelect = localConfig.baseUrl + "select";
const sourceUpdate = localConfig.baseUrl + "update/json/docs?commit=true";
const targetSelect = localConfig.targetBaseUrl + "select";
const targetUpdate = localConfig.targetBaseUrl + "update/json/docs?commit=true";

// set batch size.
const batchSize = localConfig.selectRows;

console.log(now(), "Proecess Queue: " + sourceSelect);
console.log(now(), "Store file on: " + targetUpdate);
console.log(now(), "Process " + batchSize + " docs each time!");
if(localConfig.dryRun) {
    console.log(now(), "---------------- Dry Run Mode -------------------");
}

// get authenticated to SPO
spoAuth.getAuth(spoConfig.spoUrl, 
            {username: spoConfig.username, password: spoConfig.password})
.then(options => {

    // it only contains a cookie which will have the access token.
    //console.dir(options);

    // get ready header.
    let headers = options.headers;
    //headers['Accept'] = 'application/json;odata=verbose';
    headers['Accept'] = 'application/json';

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
    
        // sync interation to get docs from source 
        // batch by batch...
        strategy.waterfallOver(localConfig.startIndex,
                               bulk, function(start, reportDone) {
    
            console.log(now(), "Start to process: ", start);
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
                // handle response here.
                //console.log("Got Response:");
                //console.dir(response.data.response.docs.length);
    
                //===========================================================
                // async call to iterate each doc / event
                let events = response.data.response.docs;
                strategy.iterateOver(events,
                function(doc, report) {
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
                    if(filePath.folder.endsWith('Certified Products')) {

                        // get ready the base URL for /Files API.
                        let theUrl = spoConfig.spoUrl + spoConfig.spoSite + 
                            "/_api/web/GetFolderByServerRelativeUrl('" +
                            encodeURIComponent(filePath.folder) + "')/Files";
                        // pass the report to function, which will process one file.
                        // report done once it is complete the process.
                        processOneFile(headers, filePath.folder, theUrl,
                                       filePath.file, report);
                    } else {
                        // report done to the iterateOver.
                        report();
                    }
                }, function() {
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
            });
    
        }, function() {
            console.log(now(), "All Done");
            // summary message:
            let endTime = new Date();
            // the differenc will be in ms
            let totalTime = endTime - startTime;
            console.log("Running time: " + prettyMs(totalTime));
        });
    })
    .catch(function(totalError) {
        console.log(now(), "Total Query Error!", totalQuery);
        if(localConfig.debugMode) console.dir(totalError);
    });

// End of spoAuth.getAuth
});

/**
 * utility function to report status.
 */
function reportStatus(doc) {

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
function processOneFile(headers, folderName, folderUrl, fileName, report) {

    // process metadata from folder name.
    let meta = spoConfig.extractFolderName(folderName, fileName);

    // process one file a time.
    //console.log("Processing file: " + fileName);

    // STEP one: extract the file number and class number from file name.
    meta = Object.assign(meta, spoConfig.extractFileName(fileName));
    //console.log("Metadata: ", meta);

    // STEP two: get file property.
    let reqGetProp = {
        url: folderUrl + "('" + fileName + "')/Properties",
        method: "get",
        headers: headers
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
            url: folderUrl + "('" + fileName + "')/$Value",
            method: "get",
            headers: headers
        };
        axios.request(reqGetFile).then(function(fileRes) {

            meta = Object.assign(meta, spoConfig.extractContent(fileRes.data, striptags));
            if(localConfig.dryRun) {
                console.log(meta[localConfig.idField]);
                report();
            } else {
            // update Solr.
            axios.post( targetUpdate, meta,
                // default limit is 10MB, set to 1GB for now.
                {maxContentLength: 1073741824} )
            .then(function(postRes) {
                // update status .
                //console.log(postRes);
                report();
            }).catch(function(postErr) {
                console.log(now(), "Failed to post solr doc", meta[localConfig.idField]);
                if(localConfig.debugMode) console.log(postErr);
                report();
            });
            }
        }).catch(function(fileErr) {
            // report status.
            console.log(now(), "Failed to get file content", reqGetFile);
            if(localConfig.debugMode) console.log(fileErr);
            report();
        });
    }).catch(function(propErr) {
        // report status.
        console.log(now(), "Failed to get file property", reqGetProp);
        if(localConfig.debugMode) console.log(propErr);
        report();
    });
}

/**
 * utitlity function to process one binary file.
 */
function processOneBinaryFile(spoHeaders, theFile, reportFile) {

    let [folderName, fileName, localFile] =
        Object.values(localConfig.getFilePath(theFile));

    // get metadata from the folder.
    let meta = spoConfig.extractFolderName(folderName, fileName,
                                           theFile);
    // check the metadata from the folder path
    //console.dir(meta);

    // TODO: check if the file exist in the target solr collection

    let folderUrl = spoConfig.spoUrl + spoConfig.spoSite +
        "/_api/web/GetFolderByServerRelativeUrl('" +
        encodeURIComponent(folderName) + "')/Files";
    // query SPO to get metadata.
    let reqGetProp = {
        url: folderUrl + "('" + fileName + "')/Properties",
        method: "get",
        headers: spoHeaders
    };
    axios.request(reqGetProp).then(function(propRes) {
        //console.dir(propRes.data);
        // extract SPO properties.
        meta = Object.assign(meta, spoConfig.extractSPOMetadata(propRes.data));
        meta = Object.assign(meta, localConfig.extractSPOMetadata(propRes.data));
        // set the ID.
        meta[localConfig.idField] = spoConfig.calcId(meta);
        //console.log(meta);

    // STEP three: get file content.
        //console.log("File content:");
        let reqGetFile = {
            url: folderUrl + "('" + fileName + "')/$Value",
            method: "get",
            headers: spoHeaders,
            responseType: 'stream'
        };

        axios.request(reqGetFile).then(function(fileRes) {

            //console.dir(fileRes.data);
            const fileStream = fileRes.data;
            let output = fs.createWriteStream(localFile);
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
                indexingOneBinaryFile(meta, localFile, fileHash, fileSize, reportFile);
                //reportFile();
            });
        })
        .catch(function(fileErr) {
            console.log("Failed to get file content:", fileName);
            console.log(fileErr);
            reportFile();
        });
    })
    .catch(function(propErr) {
        console.log("Failed to get file properties:", fileName);
        console.error(propErr);
        reportFile();
    });
    // =======================================================================
}

/**
 * untility function to process binary file indexing.
 */
function indexingOneBinaryFile(fileMeta, localPath, fileHash, fileSize, reportBinary) {

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
        try {
            tikaMeta = JSON.parse( body );
        } catch(parseError) {
            console.log('Failed to parse tikaMeta:', parseError);
            console.log(body);
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

            //console.dir(body);
            //console.log("type of body: " + typeof(body) );
            //console.log("Size of body: " + body.length );

            //=========================================================
            // get ready the payload for target collection.
            let payload = localConfig.mergeDoc( fileMeta, tikaMeta, body,
                                                fileHash, fileSize );

            if( payload === null ) {

                // this is an identical file, skip.
                //localConfig.setupStatus(eventDoc, "IDENTICAL_FILE");
                //reportStatus(eventDoc);

                // report async iteration.
                reportBinary();

            } else {

                // post payload to target collection.
                axios.post( targetEndPoint, payload,
                    // default limit is 10MB, set to 1GB for now.
                    {maxContentLength: 1073741824} )
                .then(function(postRes) {
                    console.log("Post Success! -", payload[localConfig.idField]);

                    //console.dir(postRes);
                    //localConfig.setupStatus(eventDoc, "TARGET_UPDATE_SUCCESS");
                    // update the source document, process status and
                    // process message.
                    //reportStatus(eventDoc);

                    // report async iteration.
                    reportBinary();
                }).catch(function(postError) {
                    console.log("Post Failed! -", payload[localConfig.idField]);
                    console.dir(postError);

                    // log the erorr and then report the copy is done!
                    //localConfig.setupStatus(eventDoc, "TARGET_UPDATE_FAIL");
                    // update the source document.
                    //reportStatus(eventDoc);

                    // report async iteration.
                    reportBinary();
                });
            }
        } );
    } );
}
