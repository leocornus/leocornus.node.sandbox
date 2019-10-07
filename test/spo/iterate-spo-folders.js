/**
 * testing the strategy to iterate through SPO folders.
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
const strategy = require('./../../src/libs/strategy');
// we have to use the ./ as current foler.
const config = require('./../../src/config');
const spoConfig = config.spo;
const log4js = require('log4js');
// configure log4js
log4js.configure(config.log4jsConfig);
const logger = log4js.getLogger("spo");

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

        // set up the iterator.
        let iterator = function(folder, report) {
            if( folder.Name.startsWith("Customer") ){
                processRootFolder(headers, folder.Name, report);
            } else {
                report();
            }
        };

        strategy.iterateOver(rootFolders, iterator, 
            // complete callback.
            function() {
                //console.log(`Root folder complete!`);
            }
        );
    })
    .catch(function(siteError) {
        //console.log("Failed to process site!");
        //console.log(siteError.Error);
        logger.error("Failed to process site!", siteError);
    });
});

/**
 * process the root folder
 * the folder right under the site.
 */
function processRootFolder(headers, rootFolder, report) {

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
        let cIterator = function(cFolder, cReport) {
            processCFolder(headers, cFolder, cReport);
        };

        strategy.iterateOver(cFolders, cIterator,
            // complete call back..
            function() {
                //console.log(`cFolders complete!`);
                report();
            }
        );
    })
    .catch(function(rootErr) {
        //console.log(`Failed to process root folder: ${folder.ServerRelativeUrl}`);
        //console.dir(rootErr);
        //console.log(rootErr.Error);
        logger.error(`Failed to process root folder: ${folder.ServerRelativeUrl}`, rootErr);
        report();
    });
}

/**
 * process c folder.
 */
function processCFolder(headers, folder, report) {

    // processing level 1 folder [CUSTOMER FOLDER]
    let reqOne = {
        url: spoConfig.spoUrl + spoConfig.spoSite +
             "/_api/web/getfolderbyserverrelativeurl('" +
             encodeURIComponent(folder.ServerRelativeUrl) + "')/Folders",
        method: "get",
        headers: headers
    };
    axios.request(reqOne).then(function(oneRes) {

        // processing level 2 folder [PROJECT FOLDER]
        let pFolders = oneRes.data.value;

        // set the iterator.
        let pIterator = function(pFolder, pReport) {
            processPFolder(headers, pFolder, pReport);
        };

        strategy.iterateOver(pFolders, pIterator,
            // complete call back..
            function() {
                //console.log(`pFolders complete!`);
                report();
            }
        );
    })
    .catch(function(oneErr) {
        //console.log(`Failed to process c folder: ${folder.ServerRelativeUrl}`);
        //console.dir(oneErr);
        //console.log(oneErr.response.data);
        logger.error(`Failed to process c folder: ${folder.ServerRelativeUrl}`, oneErr);
        report();
    });
}

/**
 * process p folder.
 */
function processPFolder(headers, folder, report) {

    //console.log("-- " + folder.Name);
    if(folder.Name === "Certified Products") {

        let reqFiles = {
            url: spoConfig.spoUrl + spoConfig.spoSite +
                 "/_api/web/getfolderbyserverrelativeurl('" +
                 encodeURIComponent(folder.ServerRelativeUrl) + "')/Files",
            method: "get",
            headers: headers
        };

        axios.request(reqFiles).then(function(filesRes) {

            let files = filesRes.data.value;

            // set iterator.
            let fIterator = function(file, fReport) {
                //console.log(file.Name);
                //console.log(file.ServerRelativeUrl);
                logger.info(file.ServerRelativeUrl);
                fReport();
            }

            strategy.iterateOver(files, fIterator, 
                // complet call back,
                function() {
                    //console.log(`Files complete: ${folder.ServerRelativeUrl}`);
                    report();
                }
            );
        })
        .catch(function(fileErr) {
            //console.log(`Failed to process files: ${folder.ServerRelativeUrl}`);
            //console.dir(fileErr);
            //console.log(fileErr.respose.data);
            logger.error(`Failed to process files: ${folder.ServerRelativeUrl}`, fileErr);
            report();
        });
    } else {
        //console.log(`Skip folder: ${folder.ServerRelativeUrl}`);
        report();
    }
}
