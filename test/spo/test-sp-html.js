/**
 * quick test to use node-sp-auth to connect to SPO
 * using axios to call REST APIs.
 * and load HTML file.
 *
 * The first version to process the text format files.
 *   - it is different from the binary format files.
 *     We do NOT need use Tika to convert it to text format.
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

const targetUpdate = configSolr.targetBaseUrl + "update/json/docs?commit=true";

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
    let folderName = configSPO.testData.folders[3];

    console.log(`Scan file on folder: ${configSPO.spoSite}/${folderName}`);
    console.log(`Indexing into Solr: ${targetUpdate}`);

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

        // --- for quick test
        // quick test for one file.
        //processOneFile(headers, folderName, theUrl, files[1].Name);

        // --- option one.
        // forEach will send the requests all at once!
        // it will be overwhelmed for large dataset.
        files.forEach((file) => {
            processOneFile(headers, folderName, theUrl, file.Name);
        });
    });
});

/**
 * utility function to process one file a time.
 */
function processOneFile(headers, folderName, folderUrl, fileName) {

    if( fileName.endsWith("docx") ||
        fileName.endsWith("xml") ||
        fileName.endsWith("doc") ||
        fileName.endsWith("txt") ) {

        console.log("Skip file: " + fileName);
        return;
    }

    console.log("Processing file: " + fileName);

    let meta = configSPO.extractFolderName(folderName, fileName);

    // process one file a time.
    // the Files('filename')/$Value API will return the file binary
    // in response.data.

    // STEP one: extract the file number and class number from file name.
    meta = Object.assign(meta, configSPO.extractFileName(fileName));
    //console.log("Metadata: ");
    //console.dir(meta);

    // STEP two: get file property.
    let reqGetProp = {
        url: folderUrl + "('" + fileName + "')/Properties",
        method: "get",
        headers: headers
    };
    axios.request(reqGetProp).then(function(propRes) {
        //console.dir(propRes.data);
        // extract SPO properties.
        meta = Object.assign(meta, configSPO.extractSPOMetadata(propRes.data));
        // set the ID.
        meta['id'] = configSPO.calcId(meta);

        //console.log("Updated metadata: ");
        //console.dir(meta);

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
            meta = Object.assign(meta, configSPO.extractContent(fileRes.data, striptags));

            //console.log("Updated metadata: ");
            //console.dir(meta);

            // update Solr.
            axios.post( targetUpdate, meta,
                // default limit is 10MB, set to 1GB for now.
                {maxContentLength: 1073741824} )
            .then(function(postRes) {
                //console.log(postRes);
                //console.log(
            });
        });
    });
}
