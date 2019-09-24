/**
 * quick test to use node-sp-auth to connect to SPO
 * using axios to call REST APIs.
 * and load HTML file.
 */

// we have to use the ./ as current foler.
const config = require('./../../src/config');
// the 
const spoAuth = require('node-sp-auth');
const axios = require('axios');
const striptags = require('striptags');

//console.log(JSON.stringify(config, null, 2));
const configSPO = config.spo;
const configSolr = config.solr;

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

    // try to get files for a given folder..
    let folderName = configSPO.testData.folders[0];
    //console.log(folderName);
    let theUrl = configSPO.spoUrl + configSPO.spoSite + 
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
    axios.request(reqConfig).then(function(response) {
        // dir will show up proper indention for a JSON
        // object
        // all files will be list in array named value.
        let files = response.data.value;
        //console.dir(response.data.value);
        console.log("Got " + files.length + " files");

        // process the first file.
        // the Files('filename')/$Value API will return the file binary
        // in response.data.
        console.log("Processing file: " + files[0].Name);

        // TODO: extract the file number and class number from file name.
        //
 
        console.log("File content:");
        let reqGetFile = {
            url: theUrl + "('" + files[0].Name + "')/$Value",
            method: "get",
            headers: headers
        };

        axios.request(reqGetFile).then(function(fileRes) {

            console.dir(fileRes.data);
            console.log("Striped file content:");
            console.dir(striptags(fileRes.data));
        });
    });
});
