/**
 * This is to scan SPO site and store the file information into Solr.
 */

const axios = require('axios');
const spoAuth = require('node-sp-auth');
const prettyMs = require('pretty-ms');

const strategy = require('./../../src/libs/strategy');

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

const config = require('./../../src/config');
const localConfig = config.folderPsFiles2Solr;
const spoConfig = config.spo;

// solr endpoint.
const solrEndpoint = localConfig.baseUrl + "select";
const targetQEndPoint = localConfig.targetBaseUrl + "select";
const targetEndPoint = localConfig.targetBaseUrl + "update/json/docs?commit=true";

// the basic informaiton.
console.log("From: " + solrEndpoint);
console.log("To: " + targetEndPoint);

// ===============
// complete authentication and get the header
spoAuth.getAuth(spoConfig.spoUrl,
            {username: spoConfig.username,
             password: spoConfig.password})
.then(options => {

    // let's check the options.
    // it only contains a cookie which will have the
    // access token.
    //console.dir(options);

    // get ready SPO header.
    let headers = options.headers;
    //headers['Accept'] = 'application/json;odata=verbose';
    headers['Accept'] = 'application/json';

// simple query to get total number:
let totalQuery = {
    params: {
        q: localConfig.selectQuery,
        start: localConfig.startIndex,
        rows: localConfig.selectRows,
        sort: localConfig.selectSort,
        fl: localConfig.selectFieldList
    }
}

// found out the total source docs.
axios.get(solrEndpoint, totalQuery)
.then(function(totalRes) {

    let amount = totalRes.data.response.numFound;
    console.log(`Total Folders: ${amount}`);
    let docs = totalRes.data.response.docs;
    console.log(`Processing from ${localConfig.startIndex} to ${localConfig.startIndex + docs.length - 1}`);

    // define the iterator to go through folders batch by batch.
    // the waterfall over strategy (sync)
    // for strategy.waterfallOver
    let iterator = function(index, reportBatch) {

        // Define:
        // the files array.
        let files = [];
        // the async iterator to get all files for a folder.
        let folderFiles = function(folder, reportFolder) {

            let theFolder = localConfig.getFolder(folder);
            //console.log(theFolder);

            let theUrl = spoConfig.spoUrl + spoConfig.spoSite +
                "/_api/web/GetFolderByServerRelativeUrl('" +
                encodeURIComponent(theFolder) + "')/Files";
            //console.log(theUrl);

            // prepare the axios request config.
            let reqConfig = {
              url: theUrl,
              method: "get",
              headers: headers,
            };
            // call the API to get response.
            axios.request(reqConfig).then(function(filesRes) {

                // dir will show up proper indention for a JSON
                // object
                // all files will be list in array named value.
                let oneFiles = filesRes.data.value;
                //console.dir(response.data.value);
                //console.log(`Got ${oneFiles.length} files for folder ${theFolder}` );
                files = files.concat(oneFiles);
                reportFolder();
            }).catch(function(filesErr) {
                console.log(`Failed to get files for folder ${theFolder}`);
                console.log(filesErr);
                reportFolder();
            });
        };

        // calculate the batch size.
        let batchSize = (index + localConfig.batchSize) < docs.length ?
            localConfig.batchSize : docs.length - index;

        console.log(`Processing ${localConfig.startIndex + index} - ${localConfig.startIndex + index + batchSize - 1}`);
        strategy.iterateOver(docs.slice(index, index + batchSize), folderFiles,
        /**
         * process all files at once.
         */
        function() {

            if(files.length < 1) {
                // no file found, report done.
                console.log(" - No file found!");
                reportBatch(batchSize);
            } else {
                // -- preparing payload for solr.
                let solrDocs = localConfig.prepareSolrDocs(files);

                // TODO: check if the files are exist or not.
                let sourceIds = solrDocs.map(doc => {
                    return doc[localConfig.idField];
                });
                //console.log(sourceIds.join('","'));

                // using the iterate over batch mode to avoid 
                let existDocs = [];
                // define the query iterator.
                let existQuery = function(ids, queryDone) {

                    // the query to find exist ids.
                    let queryExist = {
                        query: localConfig.idField + ":(\"" + ids.join('\",\"') + "\")",
                        params: {
                            // we need the "" for list of ids.
                            rows: ids.length,
                            fl: [localConfig.idField]
                        }
                    }
                    //console.log(queryExist);

                    axios.post(targetQEndPoint, queryExist)
                    .then(function(existRes) {

                        // store the exist docs.
                        existDocs = existDocs.concat(existRes.data.response.docs);
                        queryDone(ids.length);
                    })
                    .catch(function(existErr) {
                        console.log("Exist Query Failed!");
                        console.log(existErr);
                        //console.dir(existErr);
                        // report even there is error!
                        queryDone(ids.length);
                    });
                };

                strategy.iterateOverBatch(sourceIds, 
                    localConfig.iterateOverBatchSize, existQuery,
                // the iteration complete call back.
                function() {

                    if(existDocs.length === solrDocs.length) {
                        console.log(` - ${existDocs.length} files are exist, SKIP!`);
                        reportBatch(batchSize);
                    } else {
                        let existIds = existDocs.map(doc => {
                            return doc[localConfig.idField];
                        });
                        // remove found ids.
                        let payload = solrDocs.map(doc => {
                            if(!existIds.includes(doc[localConfig.idField])) {
                                // return not exist ids.
                                return doc;
                            }
                        });
                        // only post the new items to Solr
                        axios.post(targetEndPoint, payload
                        ).then(function(postRes) {
                            console.log(` - Post Success: ${payload.length}`);
                            // report one folder complete.
                            reportBatch(batchSize);
                            //console.dir(postRes);
                        }).catch(function(postError) {
                            console.log(` - Post Failed! ${payload.length}`);
                            //console.dir(postError.data);
                            // log the erorr and then report the copy is done!
                            reportBatch(batchSize);
                        });
                    }
                });
            }
        });
    };

    strategy.waterfallOver(0, docs.length, iterator,
        // all complete!
        function() {
            console.log(now() + " All Done");
            // summary message:
            let endTime = new Date();
            // the differenc will be in ms
            let totalTime = endTime - startTime;
            console.log("Running time: " + prettyMs(totalTime));
        }
    );
})
.catch(function(totalErr) {

    console.log("Query total rror!");
    console.dir(totalErr);
});

// end of SPO authentication.
}).catch(error => {
    // failed to authenticated from SPO.
    console.dir(error);
});
