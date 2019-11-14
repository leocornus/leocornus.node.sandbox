/**
 * simple test case to use SOAP lib.
 */

const soap = require('soap');
const log4js = require('log4js');

const config = require('./../../src/config');
const localConfig = config.soap;
// configure log4js
log4js.configure(localConfig.log4jsConfig);

// the login credential.
let loginCred = {
    "username": localConfig.username,
    "password": localConfig.password
};

// quick test for sync login
soap.createClient(localConfig.baseUrl, function(error, client) {

    //console.log(client);

    client.login(loginCred, function(err, result) {

        // here is the full callback function.
        // function(err, result, rawResponse, soapHeader, rawRequest)
        // result is a javascript object
        // rawResponse is the raw xml response string
        // soapHeader is the response soap header as a javascript object
        // rawRequest is the raw xml request string

        console.log("Sync login result:", result);
    });
});

// quick test for async call
let client = soap.createClientAsync(localConfig.baseUrl);

// async client is a promise.
console.log(client);
// Promise has then, catch and finally prototype method.
client.then( (theClient) => {

    let login = theClient.loginAsync(loginCred);
    login.then((result) => {

        // result is a javascript array containing
        // result, rawResponse, soapheader, and rawRequest
        console.log("Async login result:", result);
    })
    .catch( (loginError) => {
        console.log("Login Error:", loginError);
    });
})
.catch( (error) => {

    console.log(error);
});
