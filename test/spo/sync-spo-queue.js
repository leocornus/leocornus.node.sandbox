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
const configSPO = config.spo;

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

// simple query to get total number:
let totalQuery = {
    params: {
        q: localConfig.selectQuery,
        rows: 1,
        fl: localConfig.idField
    }
}


spoAuth.getAuth(configSPO.spoUrl, 
            {username: configSPO.username, password: configSPO.password})
.then(options => {

    // let's check the options.
    // it only contains a cookie which will have the
    // access token.
    //console.dir(options);

    // get ready header.
    let headers = options.headers;
    //headers['Accept'] = 'application/json;odata=verbose';
    headers['Accept'] = 'application/json';

    // simple get.
    axios.get(sourceSelect, totalQuery)
    .then(function(totalRes) {
    
        let amount = totalRes.data.response.numFound;
        console.log("Total Docs: " + amount);
        if( amount < 1 ) {
            console.log( now() + " No doc to process..." );
            return;
        }
    
        let bulk = Math.min(localConfig.endIndex, amount);
        console.log("Working on items from", localConfig.startIndex,
                    "to", bulk);
    
        // sync interation to get docs from source 
        // batch by batch...
        strategy.waterfallOver(localConfig.startIndex,
                               bulk, function(start, reportDone) {
    
            console.log(now() + " Start to process: " + start);
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
                let events = response.data.response.docs;
                strategy.iterateOver(events,
                function(doc, report) {
                    // brief steps:
                    // - get the file path on Azure
                    let filePath = localConfig.getFilePath(doc);
                    if( filePath === null ) {
    
                        localConfig.setupStatus(doc, "MISSING_FILE");
                        reportStatus(doc);
    
                        // report async iteration.
                        report();
                        return;
                    }
    
                    // process each file.
                    console.log(filePath);
                    if(filePath.folder.endsWith('Certified Products')) {

                        let theUrl = configSPO.spoUrl + configSPO.spoSite + 
                            "/_api/web/GetFolderByServerRelativeUrl('" +
                            encodeURIComponent(filePath.folder) + "')/Files";
                        processOneFile(headers, filePath.folder, theUrl,
                                       filePath.file, report);
                    } else {

                        report();
                    }
                }, function() {
                //===========================================================
                // End of interateOver
                    console.log(now() + " Async post done!");
                    reportDone(events.length);
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

// End of spoAuth.getAuth
});

/**
 * report status.
 */
function reportStatus(doc) {

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
 * utility function to process one file a time.
 */
function processOneFile(headers, folderName, folderUrl, fileName, report) {

    let meta = configSPO.extractFolderName(folderName, fileName);

    // process one file a time.
    // the Files('filename')/$Value API will return the file binary
    // in response.data.
    console.log("Processing file: " + fileName);

    // STEP one: extract the file number and class number from file name.
    meta = Object.assign(meta, configSPO.extractFileName(fileName));
    //console.log("Metadata: ");
    //console.dir(meta);

    // STEP two: get file property.
    let reqGetProp = {
        url: folderUrl + "('" + fileName + "')/Properties",
        method: "get",
        headers: headers
    };
    axios.request(reqGetProp).then(function(propRes) {
        //console.dir(propRes.data);
        // extract SPO properties.
        meta = Object.assign(meta, configSPO.extractSPOMetadata(propRes.data));
        // set the ID.
        meta['id'] = configSPO.calcId(meta);

        //console.log("Updated metadata: ");
        //console.dir(meta);

    // STEP three: get file content.
        //console.log("File content:");
        let reqGetFile = {
            url: folderUrl + "('" + fileName + "')/$Value",
            method: "get",
            headers: headers
        };

        axios.request(reqGetFile).then(function(fileRes) {

            //console.dir(fileRes.data);
            //console.log("Striped file content:");
            //console.dir(striptags(fileRes.data));
            //meta['file_content'] = striptags(fileRes.data);
            meta = Object.assign(meta, configSPO.extractContent(fileRes.data, striptags));

            console.log("Updated metadata: ");
            console.dir(meta);

            // update Solr.
            axios.post( targetUpdate, meta,
                // default limit is 10MB, set to 1GB for now.
                {maxContentLength: 1073741824} )
            .then(function(postRes) {
                //console.log(postRes);
                report();
            });
        });
    });
}
