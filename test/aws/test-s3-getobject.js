/**
 * test AWS S3 getObject funciton.
 */

const AWS = require('aws-sdk');

const s3 = new AWS.S3();

// we will execute the script by using nvm, for example:
// $ nvm run node test-login-got.js
const rawParams = process.argv.slice(2);
console.log(rawParams);

let params = {
    Bucket: rawParams[0],
    Key: rawParams[1]
};

s3.getObject( params, ( err, data ) => {

    if( err ) 
        return console.log(err, err.stack);

    // check data.
    console.log(data);
    // the body is a buffer.
    console.log(data.Body.toString('base64'));
} );
