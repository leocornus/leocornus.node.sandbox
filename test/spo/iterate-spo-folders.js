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
                processRootFolder(headers, folder.Name);
            } else {
                report(folder.Name, 'Skip');
            }
        };

        strategy.iterateOver(rootFolders, iterator, 
            /**
             * the report funciton.
             * 
             */
            function(folderName, action, result) {
                console.log(`Folder: ${folder.Name} - ${action} - ${result}`);
            }
        );
    })
    .catch(function(siteError) {
        console.log("Failed to process site!");
        console.dir(siteError);
    });
});

/**
 * process the root folder
 * the folder right under the site.
 */
function processRootFolder(headers, rootFolder) {

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
        let folders = response.data.value;

        //console.log(folders[0]);
        //console.log('Found Folders: ' + folders.length);
        folders.forEach((folder) => {
            //console.log(folder.Name);

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
                //console.log('Found Folders: ' + pFolders.length);
                pFolders.forEach((folder) => {
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
                            files.forEach( file => {
                                //console.log(file.Name);
                                console.log(file.ServerRelativeUrl);
                            });
                        })
                        .catch(function(fileErr) {
                            console.log(`Failed to process files: ${folder.ServerRelativeUrl}`);
                            //console.dir(fileErr);
                        });
                    }
                });
            })
            .catch(function(oneErr) {
                console.log(`Failed to process customer folder: ${folder.ServerRelativeUrl}`);
                //console.dir(oneErr);
            });
        });
        //console.log(folders[0]);
    })
    .catch(function(rootErr) {
        console.log(`Failed to process root folder: ${folder.ServerRelativeUrl}`);
        //console.dir(rootErr);
    });
}
