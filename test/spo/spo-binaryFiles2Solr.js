/**
 * This is to scan SPO site and store binary file information into Solr.
 *
 * NOTE:
 *   This version introduced the iterateOverBatch to execute
 *   exist query in batch mode.
 *   The older version is stored as file:
 *   - spo-folderFiles2Solr-0.js
 */

const axios = require('axios');
const spoAuth = require('node-sp-auth');
const prettyMs = require('pretty-ms');
const striptags = require('striptags');

const strategy = require('./../../src/libs/strategy');

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

const config = require('./../../src/config');
const localConfig = config.files2Solr;
const spoConfig = config.spo;

// solr endpoint.
const solrEndpoint = localConfig.baseUrl + "select";
const targetQEndPoint = localConfig.targetBaseUrl + "select";
const targetEndPoint = localConfig.targetBaseUrl + "update/json/docs?commit=true";

// the basic informaiton.
console.log("From: " + solrEndpoint);
console.log("To: " + targetEndPoint);

// complete authentication and get the header
spoAuth.getAuth(spoConfig.spoUrl,
            {username: spoConfig.username,
             password: spoConfig.password})
.then(options => {

    // let's check the options.
    // it only contains a cookie which will have the
    // access token.
    //console.dir(options);

    // get ready header.
    let headers = options.headers;
    //headers['Accept'] = 'application/json;odata=verbose';
    headers['Accept'] = 'application/json';

    let totalQ = {
        params: {
            q: localConfig.selectQuery,
            rows: 1,
            fl: localConfig.idField
        }
    };

    // simple get.
    axios.get(solrEndpoint, totalQ).then(function(totalRes) {

        let amount = totalRes.data.response.numFound;
        console.log("Total files: " + amount);
        let bulk = Math.min(localConfig.endIndex, amount);
        // consle.log takes multiple params.
        console.log("Working on files from", localConfig.startIndex,
                    "to", bulk);

        // define the sync iterator.
        const syncIterator = function(startIndex, syncReport) {

            // query a batch.
            let batchQ = {
                params: {
                    q: localConfig.selectQuery,
                    start: startIndex,
                    rows: localConfig.selectRows,
                    // sort to make sure we are in the same sequence 
                    // for each batch load.
                    sort: localConfig.selectSort,
                    fl: localConfig.selectFieldList
                }
            };
            axios.get(solrEndpoint, batchQ).then(function(batchRes) {

                // Got a batch of files:
                let files = batchRes.data.response.docs;

                // defind the asyncIterator, how we process each file.
                let asyncIterator = function(oneFile, asyncReport) {

                    // quick test.
                    //console.log(oneFile);
                    let [folderName, fileName] =
                        Object.values(spoConfig.getFilePath(oneFile));
                    let folderUrl = spoConfig.spoUrl + spoConfig.spoSite +
                        "/_api/web/GetFolderByServerRelativeUrl('" +
                        encodeURIComponent(folderName) + "')/Files";

                    // get metadata from the folder.
                    let meta = spoConfig.extractFolderName(folderName, fileName,
                                                           oneFile);
                    // check the metadata from the folder path
                    //console.dir(meta);

                    // STEP one: extract the file number and
                    // class number from file name.
                    meta = Object.assign(meta, spoConfig.extractFileName(fileName));

                    //console.log(meta);
    // ======================================================
    // query SPO to get metadata.
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
        meta[localConfig.idField] = spoConfig.calcId(meta);

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
            meta = Object.assign(meta,
                spoConfig.extractContent(fileRes.data, striptags));

            //console.log("Updated metadata: ");
            //console.dir(meta);

            // update Solr.
            axios.post( targetEndPoint, meta,
                // default limit is 10MB, set to 1GB for now.
                {maxContentLength: 1073741824} )
            .then(function(postRes) {
                // post success!
                //console.log(postRes);
                asyncReport();
            })
            .catch(function(postErr) {
                console.log("Failed to post:", fileName);
                console.log(postErr);
                asyncReport();
            });
        })
        .catch(function(fileErr) {
            console.log("Failed to get file content:", fileName);
            console.log(fileErr);
            asyncReport();
        });
    })
    .catch(function(propErr) {
        console.log("Failed to get file properties:", fileName);
        asyncReport();
    });
    // =======================================================================
                }; // END asyncIterator!

                // process the batch of files in parallel!
                strategy.iterateOver(files, asyncIterator,
                /**
                 * iterate over complete callback.
                 */
                function() {
                    console.log(now() + " Async post:", files.length, "files");
                    // report sync iterator.
                    syncReport(files.length);
                });
            }).catch(function(batchErr) {

                // batch query failed.
                console.log("Batch Query Failed! ", batchQ);
                console.log(batchErr);
                // still need report.
                syncReport(localConfig.selectRows);
            });
        };

        // sync iteration batch by batch.
        strategy.waterfallOver(localConfig.startIndex, bulk, syncIterator,
        /**
         * waterfall complete callback.
         */
        function() {
            console.log(now() + " All Done");
            // summary message:
            let endTime = new Date();
            // the differenc will be in ms
            let totalTime = endTime - startTime;
            console.log("Running time: " + prettyMs(totalTime));
        });
    })
    .catch(function(totalErr) {
        console.log('Failed to query total');
        console.log(totalErr);
    });

// end of SPO authentication.
})
.catch(error => {
    // failed to authenticated from SPO.
    console.dir(error);
});
