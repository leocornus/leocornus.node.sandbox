/**
 * simple test case to show how to use Vitrium APIs.
 *
 * How to run the test.
 *
 *  $ cd src
 *  $ ln -s ....vitrium.js local.js // link the local.js for vitrium
 *  $ cd ..
 *  $ nvm run node test/azure/vitrium-test.js
 */

const axios = require('axios');
// using the UUID v4.
const uuidv4 = require('uuid/v4');
// hmac-sha1 crypto
const hmacsha1 = require('crypto-js/hmac-sha1');
// we should have separate local.js file for vitrium.
const config = require('./../../src/config');

// set up the request header.
let headers = {};
headers['X-VITR-ACCOUNT-TOKEN'] = config.vitrium.accountToken;
headers["X-VITR-SESSION-TOKEN"] = config.vitrium.sessionToken;

// set the client nonce
let clientNonce = uuidv4();

// set the payload
let payload = {
  "ClientNonce": clientNonce
}

/**
 * Step 1: get challenge server to get a ServerNonce.
 */
// get ready the axios request config
let reqConf = {
  url: config.vitrium.docApiBaseUrl + '/Login/Challenge',
  method: 'post',
  headers: headers,
  data: payload
}

// challenge to get ServerNonce.
axios.request(reqConf).then(function(response) {

    // collect server Nonce
    //console.dir(response.data);
    let serverNonce = response.data.ServerNonce;

    /**
     * Step 2: get the login response.
     * - use client nonce, server nonce and password to
     *   generate the client hash
     * - collect new account token and session token for all other actions.
     * - the updated tokens will be expired in one hour
     */
    // get ready the client Hash:
    let message = clientNonce + serverNonce + config.vitrium.password;
    //console.dir(message);
    let clientHash = hmacsha1(message, config.vitrium.password);
    //console.dir(clientHash);
    //console.dir(clientHash.toString());

    // get ready the login response request.
    reqConf['url'] = config.vitrium.docApiBaseUrl + '/Login/Response';
    // the payload.
    reqConf['data'] = {
      'ClientNonce': clientNonce,
      // Vitrium requires Upper Case for client hash
      'ClientHash': clientHash.toString().toUpperCase(),
      'UserName': config.vitrium.userName,
      'ApplicationId': 'test'
    };
    //console.dir(reqConf);

    axios.request(reqConf).then(function(res) {

        console.log(res.data);
        // update headers with new tokens.
        // TODO: check to make sure the reponse has new tokens
        headers['X-VITR-ACCOUNT-TOKEN'] = res.data.Accounts[0].Id;
        headers["X-VITR-SESSION-TOKEN"] = res.data.ApiSession.Token;

    }).catch(function(err) {

        console.log(err);
    });

}).catch(function(error) {

    console.dir(error);
});