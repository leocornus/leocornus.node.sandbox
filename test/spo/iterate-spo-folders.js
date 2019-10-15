/**
 * testing the strategy to iterate through SPO folders.
 * version ?
 *   try to mix waterfallOver and iteratorOver,
 *   nest sync call nad async calls!
 *   It seems only work for 2 level of depth!
 *   need more testing.
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
// we have to use the ./ as current foler.
const config = require('./../../src/config');
const spoConfig = config.spo;
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
            //logger.info(`processiong C folder: ${cFolder.Name}`);
            //console.log(`processiong C folder: ${cFolder.Name}`);
            console.log(`${cFolder.ServerRelativeUrl}`);
            cReport(1);
            //processCFolder(headers, cFolder, cReport);
        };

        strategy.waterfallOver(0, cFolders.length, cIterator,
            // complete call back..
            function() {
                //console.log(`cFolders complete!`);
                //logger.info(`complete folder: ${rootFolder}`);
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

/**
 * process c folder.
 */
function processCFolder(headers, folder, reportC) {

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
            //logger.info(`processiong P folder: ${pFolder.Name}`);
            //console.log(`processiong P folder: ${pFolder.Name}`);
            console.log(`${pFolder.ServerRelativeUrl}`);
            pReport();
            //processPFolder(headers, pFolder, pReport);
        };

        strategy.iterateOver(pFolders, pIterator,
            // complete callback..
            function() {
                //console.log(`pFolders complete!`);
                reportC(1);
            }
        );
    })
    .catch(function(oneErr) {
        //console.log(`Failed to process c folder: ${folder.ServerRelativeUrl}`);
        //console.dir(oneErr);
        //console.log(oneErr.response.data);
        logger.error(`Failed to process C folder: ${folder.ServerRelativeUrl}`, oneErr);
        //console.error(`Failed to process c folder: ${folder.ServerRelativeUrl}`, oneErr);
        reportC(1);
    });
}

/**
 * process p folder.
 */
function processPFolder(headers, folder, reportP) {

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
                //logger.info(`processiong File: ${file.Name}`);
                //console.log(file.Name);
                console.log(file.ServerRelativeUrl);
                //logger.info(file.ServerRelativeUrl);
                fReport();
            }

            strategy.iterateOver(files, fIterator, 
                // complet call back,
                function() {
                    //console.log(`Files complete: ${folder.ServerRelativeUrl}`);
                    reportP();
                }
            );
        })
        .catch(function(fileErr) {
            //console.log(`Failed to process files: ${folder.ServerRelativeUrl}`);
            //console.dir(fileErr);
            //console.log(fileErr.respose.data);
            reportP();
        });
    } else {
        //console.log(`Skip folder: ${folder.ServerRelativeUrl}`);
        reportP();
    }
}
