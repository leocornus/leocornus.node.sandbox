/**
 * This is to scan SPO site and store the document collection (Ps)
 * information into Solr.
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
const flat = require('array.prototype.flat');

const strategy = require('./../../src/libs/strategy');

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

const config = require('./../../src/config');
const localConfig = config.folderPs2Solr;
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

    // define the iterator to go through each folder.
    // the waterfall over strategy (sync)
    let iterator = function(index, reportOne) {

        let theFolder = localConfig.getFolder(docs[index]);
        //console.log(theFolder);

        let theUrl = spoConfig.spoUrl + spoConfig.spoSite +
            "/_api/web/GetFolderByServerRelativeUrl('" +
            encodeURIComponent(theFolder) + "')/Folders";
        //console.log(theUrl);

        // prepare the axios request config.
        let reqConfig = {
          url: theUrl,
          method: "get",
          headers: headers,
        };

        // call the API to get response.
        axios.request(reqConfig).then(function(response) {
            // dir will show up proper indention for a JSON
            // object
            // all folders will be list in array named value.
            let folders = response.data.value;
            //console.dir(response.data.value);
            console.log(`Got ${folders.length} folders for folder ${theFolder}` );

            // --- pring all file's ServerRelativeUrl for testing..
            // forEach will send the requests all at once!
            // it will be overwhelmed for large dataset.
            //folders.forEach((folder) => {
            //    console.log(folder.ServerRelativeUrl);
            //});

            if(folders.length < 1) {
                // no folder found, report done.
                reportOne(1);
            } else {
                // -- preparing payload for solr.
                let docs = localConfig.prepareSolrDocs(flat, folders,
                    localConfig.pFolders);

                let sourceIds = docs.map(doc => {
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
                        console.dir(existErr);
                        // report even there is error!
                        queryDone(ids.length);
                    });
                };

                strategy.iterateOverBatch(sourceIds,
                    localConfig.iterateOverBatchSize, existQuery,
                // the iteration complete call back.
                function() {

                    let payload = [];

                    if(existDocs.length === docs.length) {

                        console.log(` - All folders are exist, SKIP!`);
                        reportOne(1);
                        return;

                    } else if(existDocs.length > 1) {

                        let existIds = existDocs.map(doc => {
                            return doc[localConfig.idField];
                        });
                        // remove found docs by existing ids.
                        payload = docs.map(doc => {
                            if(!existIds.includes(doc[localConfig.idField])) {
                                // return not exist ids.
                                return doc;
                            }
                        });

                    } else {
                        // no docs exist in Solr, we will handle all of them.
                        payload = docs;
                    }

                    // only post the new items to Solr
                    axios.post(targetEndPoint, payload
                    ).then(function(postRes) {
                        console.log(` - Post Success: ${payload.length} ${theFolder}`);
                        // report one folder complete.
                        reportOne(1);
                        //console.dir(postRes);
                    }).catch(function(postError) {
                        console.log(` - Post Failed! ${payload.length} ${theFolder}`);
                        //console.dir(postError.data);
                        // log the erorr and then report the copy is done!
                        reportOne(1);
                    });
                });
            }
        })
        .catch(function(resErr) {
            console.log(`Failed to get folders for folder ${theFolder}`);
            console.log(resErr);
            // report folder complete.
            reportOne(1);
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
