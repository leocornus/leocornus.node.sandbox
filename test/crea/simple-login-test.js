/**
 * quick test to get connect to CREA service.
 */

const axios = require('axios');

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
      console.dir(response);
      console.log('Authenticated');
}).catch(function(error) {
      console.dir(error);
      console.log('Error on Authentication');
});

// TODO: got 502 Gateway error! need check more!
