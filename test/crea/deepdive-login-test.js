/**
 * quick test to get connect to CREA service.
 */

const axios = require('axios');
const request = require('request');
const md5 = require('crypto-js/md5');

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

    // get the authentication params
    var authHeaders = error.response.headers['www-authenticate'];
    var authParams = authHeaders.substring(7).split( ', ' ).
        // convert an arry to a Object.
        reduce( (params, item) => {
            var parts = item.split('=');
            params[parts[0]] = parts[1].replace(/"/g, '');
            return params;
        }, {} );
    console.dir(authParams);

    // stringify the params:
    var authParamStr = Object.keys(authParams).reduce( (paramStr, key) => {
        return paramStr + ', ' + key + '="' + authParams[key] + '"';
    }, '' );
    console.log('Digest ' + authParamStr.substring(2));
});
