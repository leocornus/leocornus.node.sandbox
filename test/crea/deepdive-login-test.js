/**
 * quick test to get connect to CREA service.
 */

const axios = require('axios');
const request = require('request');

// load configuration
const config = require('./../../src/config');
const localConfig = config.crea;

console.log(localConfig.loginUrl);

// CREA using basic digest auth to do authentication:
var token = Buffer.from(localConfig.username + ':' + localConfig.password)
            .toString('base64');
var options = {
    headers:{
        'Authorization': 'Basic ' + token 
    }
};

// issue the challendge request
axios.get(localConfig.loginUrl).then(function(response) {
    //console.dir(response.response);
    console.dir(response.response.headers);
}).catch(function(error) {
    // we expect error here.
    //console.dir(error.response);
    console.dir(error.response.headers);
});
