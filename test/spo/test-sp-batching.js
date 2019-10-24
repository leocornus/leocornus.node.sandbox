/**
 * quick test the batching request to SPO site.
 *
 * execute the test by using the following command:
 *  nvm run node test/spo/test-sp-batching.js
 */

const fs = require('fs');
// we have to use the ./ as current foler.
const config = require('./../../src/config');
const spoAuth = require('node-sp-auth');
//const request = require('request-promise');
const axios = require('axios');

//console.log(JSON.stringify(config, null, 2));
const localConfig = config.folderBatching;
const spoConfig = config.spo;

// solr endpoint.
const solrEndpoint = localConfig.baseUrl + "select";

spoAuth.getAuth(spoConfig.spoUrl,
            {username: spoConfig.username,
             password: spoConfig.password})
.then( options => {
    // let's check the options.
    // it only contains a cookie which will have the
    // access token.
    //console.dir(options);

    // perform request with any http-enabled library
    // (request-promise in a sample below):
    let headers = options.headers;
    //headers['Accept'] = 'application/json;odata=verbose';
    headers['Accept'] = 'application/json';

    let fQuery = {
        params: {
            q: localConfig.selectQuery,
            start: localConfig.startIndex,
            rows: localConfig.selectRows,
            sort: localConfig.selectSort,
            fl: localConfig.selectFieldList
        }
    };

    axios.get(solrEndpoint, fQuery).then( (fRes) => {

        let folders = fRes.data.response.docs;

        folders.forEach( (f) => {

            let folderName = localConfig.getFolder(f);
            let theUrl = spoConfig.spoUrl + spoConfig.spoSite +
                "/_api/web/GetFolderByServerRelativeUrl('" +
                encodeURIComponent(folderName) + "')/Files";
            //console.log(theUrl);

            // prepare the axios request config.
            let reqConfig = {
              url: theUrl,
              method: "get",
              headers: headers,
            };
            // call the API to get response.
            axios.request(reqConfig).then(function(filesRes) {

                let files = filesRes.data.value;
                console.log(`Got ${files.length} files for folder ${folderName}`);
            }).catch( (filesErr) => {
                console.log('Failed to get files for folder', folderName);
                console.error(filesErr);
            });;
        });
    }).catch( (fErr) => {

        console.log(fErr);
    });
} );
