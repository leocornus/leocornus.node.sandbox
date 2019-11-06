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
const request = require('request');

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

    // set header for batching request.
    let batchUUID = 'batch_' + generateUUID();


//            let theUrl = spoConfig.spoUrl + spoConfig.spoSite +
//                "/_api/web/GetFolderByServerRelativeUrl('" +
//                encodeURIComponent(folderName) + "')/Files";

    // set the batching request endpoint
    const batchEndpoint = spoConfig.spoUrl + spoConfig.spoSite + "/_api/$batch";
    //const batchEndpoint = spoConfig.spoUrl + spoConfig.spoSite + "/_api/web";
    //const batchEndpoint = spoConfig.spoUrl + "/_api/$batch";

    // set the multiple requests.
    const folders = spoConfig.testData.folders.slice(4);
    let batchContents = folders.map(folder => {
        // try to get files for each folder.
        let folderEndpoint = spoConfig.spoUrl + spoConfig.spoSite +
                "/_api/web/GetFolderByServerRelativeUrl('" +
                encodeURIComponent(folder) + "')/Files";
                //folder + "')/Files";
        let oneReq = [];
        oneReq.push('--' + batchUUID);
        oneReq.push('Content-Type: application/http');
        oneReq.push('Content-Transfer-Encoding: binary');
        oneReq.push('');
        oneReq.push('GET ' + folderEndpoint + ' HTTP/1.1');
        oneReq.push('Accept: application/json;odata=verbose');
        oneReq.push('');

        return oneReq.join("\r\n");
    });

    // add the ending.
    //batchContents.push('--' + batchUUID + '--');
    let batchBody = batchContents.join("\r\n");

    // build the batch request body.
    let batchReqBody = [];

    batchReqBody.push('Content-Type: multipart/mixed;boundary="' + batchUUID + '"');
    batchReqBody.push('Content-Length: ' + batchBody.length);
    batchReqBody.push('Accept: application/json');
    batchReqBody.push('Content-Transfer-Encoding: binary');
    batchReqBody.push('');
    batchReqBody.push(batchBody);
    batchReqBody.push('');
    batchReqBody.push('--' + batchUUID + '--');

    //console.log(batchBody);

    // prepare the axios request config.
    headers['Content-Type'] = `multipart/mixed;boundary=${batchUUID}`;
    headers['Accept'] = "applicaiton/json";
    //console.log(headers);
    let batchReq = {
      url: batchEndpoint,
      // has to be POST for batching request.
      //method: "post",
      headers: headers,
      body: batchReqBody.join("\r\n")
      //data: batchReqBody.join("\r\n")
      //formData: batchReqBody.join("\r\n")
    };
    console.log(batchReq);

    // call the API to get response.
    //axios.request(batchReq).then(function(batchRes) {
    //    console.dir(batchRes);
    //}).catch(function(batchErr) {
    //    console.dir(batchErr.response.data);
    //});
    request.post( batchReq, function(batchErr, batchRes, body) {

        if(batchErr) {
            console.dir(batchErr);
        }
        //console.dir(batchRes);
        console.dir(body);
    } );
} );

/*
 * @name generateUUID
 * @description
 * Generates a GUID-like string, used in OData HTTP batches.
 * 
 * @returns {string} - A GUID-like string.
 */
function generateUUID() {

  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
  });
  return uuid;
};

// ----------------------------------------------------------------
// backup here
// ----------------------------------------------------------------
//    let fQuery = {
//        params: {
//            q: localConfig.selectQuery,
//            start: localConfig.startIndex,
//            rows: localConfig.selectRows,
//            sort: localConfig.selectSort,
//            fl: localConfig.selectFieldList
//        }
//    };
//
//    axios.get(solrEndpoint, fQuery).then( (fRes) => {
//
//        let folders = fRes.data.response.docs;
//
//        folders.forEach( (f) => {
//
//            let folderName = localConfig.getFolder(f);
//            let theUrl = spoConfig.spoUrl + spoConfig.spoSite +
//                "/_api/web/GetFolderByServerRelativeUrl('" +
//                encodeURIComponent(folderName) + "')/Files";
//            //console.log(theUrl);
//
//            // prepare the axios request config.
//            let reqConfig = {
//              url: theUrl,
//              method: "get",
//              headers: headers,
//            };
//            // call the API to get response.
//            axios.request(reqConfig).then(function(filesRes) {
//
//                let files = filesRes.data.value;
//                console.log(`Got ${files.length} files for folder ${folderName}`);
//            }).catch( (filesErr) => {
//                console.log('Failed to get files for folder', folderName);
//                console.error(filesErr);
//            });;
//        });
//    }).catch( (fErr) => {
//
//        console.log(fErr);
//    });
