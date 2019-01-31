"use strict";

/**
 * utilities to manipulate Vitrium APIs.
 */

const axios = require('axios');
// using the UUID v4.
const uuidv4 = require('uuid/v4');
// hmac-sha1 crypto
const hmacsha1 = require('crypto-js/hmac-sha1');

const vitrium = function(account, username, password) {

    // base url to access Vitrium documents.
    this.docApiBaseUrl = 'https://docs-ca.vitrium.com/api/2.0/';
    // base URL to security APIs.
    this.securityApiBaseUrl = 'https://security-ca.vitrium.com/api/2.0/';

    // set the instance property.
    this.accountToken = account;
    this.username = username;
    this.password = password;
};

module.exports = vitrium;

vitrium.prototype.estabilishSession = function(callback) {

    let self = this;

    // set up the request header.
    let headers = {};
    headers['X-VITR-ACCOUNT-TOKEN'] = self.accountToken;
    headers["X-VITR-SESSION-TOKEN"] = uuidv4();

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
        let message = clientNonce + serverNonce + self.password;
        //console.dir(message);
        let clientHash = hmacsha1(message, self.password);
        //console.dir(clientHash);
        //console.dir(clientHash.toString());

        // get ready the login response request.
        reqConf['url'] = self.docApiBaseUrl + 'Login/Response';
        // the payload.
        reqConf['data'] = {
          'ClientNonce': clientNonce,
          // Vitrium requires Upper Case for client hash
          'ClientHash': clientHash.toString().toUpperCase(),
          'UserName': self.username,
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
            callback(null, err);
        });

    }).catch(function(error) {

        console.dir(error);
        callback(null, error);
    });
};

let vitriumStatic = {

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
    },

    /**
     * quick method to get policy.
     *
     */
    getPolicies(account, session, offset, limit, callback) {

        // get ready the request.
        let policyReq =
            this.buildGetRequest('Policy', account, session, offset, limit);

        //console.log(policyReq);
        this.generalApiCall(policyReq, callback);
    },

    /**
     * get all readers.
     */
    getReaders(account, session, callback) {

        // build the request.
        let readerReq = {
            // security APIs.
            url: this.securityApiBaseUrl + 'Reader',
            method: 'get',
            headers: {
              'X-VITR-ACCOUNT-TOKEN': account,
              'X-VITR-SESSION-TOKEN': session
            },
            params: {
              "page": {
                 "index": 1,
                 "size": 5
              }
            }
        };

        this.generalApiCall(readerReq, callback);
    },

    /**
     * get one reader by user name.
     */
    getReader(account, session, username, callback) {
    
        // build the request.
        let readerReq = {
            // security APIs.
            url: this.securityApiBaseUrl + 'Reader/Username',
            method: 'get',
            headers: {
              'X-VITR-ACCOUNT-TOKEN': account,
              'X-VITR-SESSION-TOKEN': session
            },
            params: {
              "Username": username
            }
        };

        this.generalApiCall(readerReq, callback);
    },

    /**
     * get multiple docs
     *
     * offset starts from 1
     */
    getDocs(account, session, offset, limit, callback) {

        // construct the query request.
        let docsReq =
            this.buildGetRequest('Doc', account, session, offset, limit);

        this.generalApiCall(docsReq, callback);
    },

    /**
     * get multiple docs
     *
     * offset starts from 1
     */
    getFolders(account, session, offset, limit, callback) {

        // construct the query request.
        let foldersReq =
            this.buildGetRequest('Folder', account, session, offset, limit);

        this.generalApiCall(foldersReq, callback);
    },

    /**
     * utility function to get ready the get request.
     */
    buildGetRequest(uri, account, session, offset, limit) {

        return {
            url: this.docApiBaseUrl + uri,
            method: 'get',
            headers: {
              'X-VITR-ACCOUNT-TOKEN': account,
              'X-VITR-SESSION-TOKEN': session
            },
            params: {
              "page": {
                 "index": offset,
                 "size": limit
              }
            }
        };
    },

    /**
     * General api calls.
     * The callback will have 2 params: res, err.
     */
    generalApiCall(req, callback) {

        axios.request(req).then(function(res) {

            //console.log(res);
            console.log(res.config);
            console.log(res.data);
            callback(res);
        }).catch(function(err) {

            console.log(err.data);
            callback(null, err);
        });
    }
};

