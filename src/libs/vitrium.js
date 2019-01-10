/**
 * utilities to manipulate Vitrium APIs.
 */

const axios = require('axios');
// using the UUID v4.
const uuidv4 = require('uuid/v4');
// hmac-sha1 crypto
const hmacsha1 = require('crypto-js/hmac-sha1');

let vitrium = {

    // base url to access Vitrium documents.
    docApiBaseUrl: 'https://docs-ca.vitrium.com/api/2.0/',
    // base URL to security APIs.
    securityApiBaseUrl: 'https://security-ca.vitrium.com/api/2.0/',

    /**
     * run through login challenge and respond to login challenge
     * go get a valide ApiSession token
     */
    estabilishSession(account, session, userName, password, callback) {

        let self = this;

        // set up the request header.
        let headers = {};
        headers['X-VITR-ACCOUNT-TOKEN'] = account;
        headers["X-VITR-SESSION-TOKEN"] = session;
        
        // set the payload
        let clientNonce = uuidv4();
        
        /**
         * Step 1: get challenge server to get a ServerNonce.
         */
        // get ready the axios request config
        let reqConf = {
          url: self.docApiBaseUrl + 'Login/Challenge',
          method: 'post',
          headers: headers,
          data: {
            "ClientNonce": clientNonce
          }
        };

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
            let message = clientNonce + serverNonce + password;
            //console.dir(message);
            let clientHash = hmacsha1(message, password);
            //console.dir(clientHash);
            //console.dir(clientHash.toString());
        
            // get ready the login response request.
            reqConf['url'] = self.docApiBaseUrl + 'Login/Response';
            // the payload.
            reqConf['data'] = {
              'ClientNonce': clientNonce,
              // Vitrium requires Upper Case for client hash
              'ClientHash': clientHash.toString().toUpperCase(),
              'UserName': userName,
              'ApplicationId': 'test'
            };
            //console.dir(reqConf);
        
            axios.request(reqConf).then(function(res) {
        
                console.log(res.data);
                // update headers with new tokens.
                // TODO: check to make sure the reponse has new tokens
                headers['X-VITR-ACCOUNT-TOKEN'] = res.data.Accounts[0].Id;
                headers["X-VITR-SESSION-TOKEN"] = res.data.ApiSession.Token;

		// callback!
		callback(headers);
            }).catch(function(err) {
        
                console.log(err);
            });
        
        }).catch(function(error) {
        
            console.dir(error);
        });
    }
};

module.exports = vitrium;