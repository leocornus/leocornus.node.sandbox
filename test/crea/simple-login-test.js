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
            .toString('base64')

axios.get(localConfig.loginUrl, {
    headers:{
        'Authorization': 'Basic ' + token 
    }
}).then(function(response) {
      //console.dir(response);
      console.log('Authenticated');
}).catch(function(error) {
      //console.dir(error);
      console.log('Error on Authentication');
});

// TODO: got 502 Gateway error! need check more!

var authReq = {
    url: localConfig.loginUrl,
    // no need this header.
    //headers:{
    //    "RETS-Version": "RETS/1.5",
    //    "Accept": "*/*"
    //    //'Authorization': 'Basic ' + token 
    //},
    auth: {
        username: localConfig.username,
        password: localConfig.password,
        // this option make the magic to avoid the 502 error
        sendImmediately: false
    }
};

request.get(authReq, function(err, res, body) {

    console.log(err);
    console.log(res.headers);
    console.log(body);
    console.log(res);
});
