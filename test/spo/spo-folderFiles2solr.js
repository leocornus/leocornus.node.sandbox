/**
 * This is to copy docs from Solr to Solr.
 */

const axios = require('axios');
const spoAuth = require('node-sp-auth');
const prettyMs = require('pretty-ms');

const strategy = require('./../../src/libs/strategy');

// timestamp for logging message.
const now = () => new Date().toUTCString()
const startTime = new Date();

const config = require('./../../src/config');
const localConfig = config.folderFiles2Solr;
const spoConfig = config.spo;

// solr endpoint.
const solrEndpoint = localConfig.baseUrl + "select";
const targetQEndPoint = localConfig.targetBaseUrl + "select";
const targetEndPoint = localConfig.targetBaseUrl + "update/json/docs?commit=true";

// the basic informaiton.
console.log("From: " + solrEndpoint);
console.log("To: " + targetEndPoint);

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
    console.log(`Total Docs: ${amount}`);

    let docs = totalRes.data.response.docs;
    let iterator = function(index, reportOne) {
        let theFolder = localConfig.getFolder(docs[index]);
        //console.log(theFolder);

        // load all files for the folder from SPO site.
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
            axios.request(reqConfig).then(function(response) {
                // dir will show up proper indention for a JSON
                // object
                // all files will be list in array named value.
                let files = response.data.value;
                //console.dir(response.data.value);
                console.log(`Got ${files.length} files for folder ${theFolder}` );

                // --- for quick test
                // quick test for one file.
                //processOneFile(headers, folderName, theUrl, files[1].Name);

                // --- pring all file's ServerRelativeUrl for testing..
                // forEach will send the requests all at once!
                // it will be overwhelmed for large dataset.
                //files.forEach((file) => {
                //    console.log(file.ServerRelativeUrl);
                //});

                if(files.length < 1) {
                    reportOnde(1);
                } else {
                    // -- preparing payload for solr.
                    let docs = localConfig.prepareSolrDocs(files);

                    // TODO: check if the files are exist or not.
                    let sourceIds = docs.map(doc => {
                        return doc[localConfig.idField];
                    });
                    //console.log(sourceIds.join('","'));

                    let queryExist = {
                        params: {
                            // we need the "" for list of ids.
                            q: localConfig.idField + ":(\"" + sourceIds.join('\",\"') + "\")",
                            rows: docs.length,
                            fl: localConfig.idField
                        }
                    }
                    //console.log(queryExist);

                    axios.get(targetQEndPoint, queryExist)
                    .then(function(existRes) {

                        let existDocs = existRes.data.response.docs;
                        if(existDocs.length === docs.length) {
                            console.log(` - All files are exist, SKIP!`);
                            reportOne(1);
                        } else {
                            let existIds = existDocs.map(doc => {
                                return doc[localConfig.idField];
                            });
                            // remove found ids.
                            let payload = docs.map(doc => {
                                if(! existIds.includes(doc[localConfig.idField])) {
                                    // return not exist ids.
                                    return doc;
                                }
                            });
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
                        }
                    })
                    .catch(function(existErr) {
                        console.log("Exist Query Failed!");
                        console.error(existErr);
                        // report one folder complete.
                        reportOne(1);
                    });
                }
            })
            .catch(function(resErr) {
                console.log(`Failed to get files for folder ${theFolder}`);
                // report folder complete.
                reportOne(1);
            });
        }).catch(error => {
            console.dir(error);
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

    console.log("Total Query Error!");
    console.dir(totalErr);
});
