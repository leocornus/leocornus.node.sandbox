/**
 * quick test to get connect to Tika server.
 *
 * Overview about Tika server:
 * - https://wiki.apache.org/tika/TikaJAXRS
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// load configuration
const config = require('./../../src/config');
const localConfig = config.tika;

// simple get.
axios.get(localConfig.baseUrl + "tika", {})
.then(function(res) {
    console.dir(res.data);
})
.catch(function(err) {
    console.dir(err);
});

// try the multipart/form-data POST request directly.
let multipartPost = {
    method: 'post',
    url: localConfig.baseUrl + 'meta/form',
    data: {
        file: fs.createReadStream(localConfig.testData[0].file)
    },
    headers: {
        "Accept": "application/json",
        "Content-Type": "multipart/form-data"
    }
}
axios.request(multipartPost).then(function(mRes) {
    console.dir(mRes.data);
}).catch(function(mErr) {
    //console.dir(mErr);
    console.log(mErr.response.data);
});

// try to POST multipart/form-data using the FormData class.
// TODO: Has errors!
let tikaFormData = new FormData();
tikaFormData.append( 'file', fs.createReadStream( localConfig.testData[0].file ) );
//    {
//        filename: localConfig.testData[0].file,
//        contentType: 'application/octet-stream',
//    }
//);

// curnt the formdata int a buffer for Axios.
let formDataBuffer = formDataToBuffer(tikaFormData);

axios.post( localConfig.baseUrl + 'meta/form',
            formDataBuffer,
            {
                headers: {
                    User_Agent: 'Some Useragent',
                    Accept: 'application/json',
                    'Content-Type': tikaFormData.getHeaders()['content-type'],
                },
            } )
.then( function( pRes ) {
    console.log( pRes.data );
} ).catch( function( pErr ) {

    console.log( mErr.response.data );
} );

function formDataToBuffer( formData ) {
    let dataBuffer = new Buffer( 0 );
    let boundary   = formData.getBoundary();
    for( let i = 0, len = formData._streams.length; i < len; i++ ) {

        if( typeof formData._streams[i] !== 'function' ) {

            dataBuffer = bufferWrite( dataBuffer, formData._streams[i] );

            // The item have 2 more "-" in the boundary. No clue why
            // rfc7578 specifies (4.1): "The boundary is supplied as a "boundary"
            //    parameter to the multipart/form-data type.  As noted in Section 5.1
            //    of [RFC2046], the boundary delimiter MUST NOT appear inside any of
            //    the encapsulated parts, and it is often necessary to enclose the
            //    "boundary" parameter values in quotes in the Content-Type header
            //    field."
            // This means, that we can use the boundary as unique value, indicating that
            // we do NOT need to add a break (\r\n). These are added by data-form package.
            //
            // As seen in this example (https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST#Example)
            // the boundary is preceded by 2x "-". If thus --Boundary exists, do not add the break.
            if( typeof formData._streams[i] !== 'string' || formData._streams[i].substring( 2, boundary.length + 2 ) !== boundary ) {
                dataBuffer = bufferWrite( dataBuffer, "\r\n" );
            }
        }
    }

    // Close the request
    dataBuffer = this.bufferWrite( dataBuffer, '--' + boundary + '--' );

    return dataBuffer;
}

// Below function appends the data to the Buffer.
function bufferWrite( buffer, data ) {

    let addBuffer;
    if( typeof data === 'string' ) {
        addBuffer = Buffer.from( data );
    }
    else if( typeof data === 'object' && Buffer.isBuffer( data ) ) {
        addBuffer = data;
    }

    console.dir(addBuffer);
    return Buffer.concat( [buffer, addBuffer] );
}
