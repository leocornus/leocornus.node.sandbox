/**
 * load SPO folders into Solr colleciton.
 *
 * SPO folder structure:
 * [SPO SITE] [https://corp.sharepoint.com/sites/mysite]
 *   - [START FOLDER] Root folder
 *     - [CUSTOMER FOLDER] Level one folder
 *       - [PROFILE FOLDER] Level two folder
 *         - FILES
 *       - [PROJECT FOLDER]
 *         - [UTIL FOLDERS]
 */

const spoAuth = require('node-sp-auth');
const axios = require('axios');
const prettyMs = require('pretty-ms');

const strategy = require('./../../src/libs/strategy');

// decide the configuraion.
// we have to use the ./ as current foler.
const config = require('./../../src/config');
const spoConfig = config.spo;
const solrConfig = config.folder2Solr;
const targetQEndPoint = solrConfig.targetBaseUrl + "select";
const targetEndPoint = solrConfig.targetBaseUrl + "update/json/docs?commit=true";

const log4js = require('log4js');
// configure log4js
log4js.configure(config.log4jsConfig);
const logger = log4js.getLogger("spo");

// set start time.
const startTime = new Date();
// try to get access headers
spoAuth.getAuth(spoConfig.spoUrl, 
            {username: spoConfig.username, password: spoConfig.password})
.then(options => {

    let headers = options.headers;
    headers['Accept'] = 'application/json';
    //console.log(headers);

    let reqSite = {
        url: spoConfig.spoUrl + spoConfig.spoSite +
             "/_api/web/getfolderbyserverrelativeurl('" +
             encodeURIComponent(spoConfig.spoSite) + "')/Folders",
        method: "get",
        headers: headers
    }

    //processRootFolder(headers, spoConfig.startFolder[0]);
    axios.request(reqSite).then(function(siteRes) {

        let rootFolders = siteRes.data.value;

        // set up the waterfall over iterator.
        // we will process one by one.
        let iterator = function(index, rReport) {

            let folder = rootFolders[index];

            if( folder.Name.startsWith("Customer") ){

                //logger.info(`processing R folder: ${folder.Name}`);
                //console.log(`processing R folder: ${folder.Name}`);
                processRootFolder(headers, folder.Name, rReport);
                //rReport(1);
            } else {

                //logger.info(`skip R folder: ${folder.Name}`);
                console.log(`skip R folder: ${folder.Name}`);
                rReport(1);
            }
        };

        // the start, 0 here, will be used to start the iterator.
        strategy.waterfallOver(0, rootFolders.length, iterator,
            // waterfall over iteration callback
            function () {
                //logger.info("All Done");
                console.log("All Done");
                // calculate how long it takes.
                let endTime = new Date();
                //logger.info(`Running time: ${prettyMs(endTime - startTime)}`);
                console.log(`Running time: ${prettyMs(endTime - startTime)}`);
            }
        );
    })
    .catch(function(siteError) {
        //console.log("Failed to process site!");
        //console.log(siteError.Error);
        //logger.error("Failed to process site!", siteError);
        console.log("Failed to process site!", siteError);
    });
});

/**
 * process the root folder
 * the folder right under the site.
 */
function processRootFolder(headers, rootFolder, reportR) {

    // root folder group folder.
    let reqRoot = {
        url: spoConfig.spoUrl + spoConfig.spoSite +
             "/_api/web/getfolderbyserverrelativeurl('" +
             encodeURIComponent(rootFolder) + "')/Folders",
        method: "get",
        headers: headers
    };

    // call the API to get response.
    axios.request(reqRoot).then(function(response) {

        // TODO: what's the limit of the Folders API?
        let cFolders = response.data.value;

        // set the iterator.
        let cIterator = function(index, cReport) {

            let cFolder = cFolders[index];
            let folderPath = cFolder.ServerRelativeUrl;

            //console.log(`${folderPath}`);
            let solrDoc = solrConfig.prepareSolrFolderDoc(folderPath);

            // query to check if the solr doc exist.
            let existQ = {
                params: {
                    q: `${solrConfig.idField}:${solrDoc[solrConfig.idField]}`,
                    fl: `${solrConfig.idField}`
                }
            }
            axios.get(targetQEndPoint, existQ)
            .then(function(getRes) {

                if(getRes.data.response.numFound > 0) {
                    // Solr doc exist, skip.
                    console.log(`Skip exist folder ${index}: ${folderPath}`);
                    cReport(1);
                } else {

                    // Solr doc NOT exist.
                    axios.post(targetEndPoint, solrDoc
                    ).then(function(postRes) {
                        console.log(`Post Success ${index}: ${folderPath}`);
                        cReport(1);
                        //console.dir(postRes);
                    }).catch(function(postError) {
                        console.log(`Post Failed ${index}! - ${folderPath}`);
                        //console.dir(postError.data);
                        // log the erorr and then report the copy is done!
                        cReport(1);
                    });
                }
            })
            .catch(function(getErr) {
                console.log(`Failed to query folder: ${folderPath}`);
                cReport(1);
            });
        };

        strategy.waterfallOver(0, cFolders.length, cIterator,
            // complete call back..
            function() {
                console.log(`complete folder: ${rootFolder}`);
                reportR(1);
            }
        );
    })
    .catch(function(rootErr) {
        //console.log(`Failed to process root folder: ${folder.ServerRelativeUrl}`);
        //console.dir(rootErr);
        //console.log(rootErr.Error);
        logger.error(`Failed to process root folder: ${rootFolder.ServerRelativeUrl}`, rootErr);
        reportR(1);
    });
}
