"use strict";

/**
 * utilities to manipulate Vitrium APIs.
 */

const axios = require('axios');
// using the UUID v4.
const uuidv4 = require('uuid/v4');
// hmac-sha1 crypto
const hmacsha1 = require('crypto-js/hmac-sha1');
const md5 = require('crypto-js/md5');

const fs = require('fs');

/**
 * using the function expressions to define the class.
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function
 *
 * This fuunction is actually works as a constructor.
 */
const Vitrium = function Vitrium (account, username, password) {

    // base url to access Vitrium documents.
    this.docApiBaseUrl = 'https://docs-ca.vitrium.com/api/2.0/';
    // base URL to security APIs.
    this.securityApiBaseUrl = 'https://security-ca.vitrium.com/api/2.0/';

    // set the instance property.
    this.initAccountToken = account;
    this.accountToken = '';
    this.sessionToken = '';
    this.username = username;
    this.password = password;

    // local file to store the API session token.
    this.tokenFilePath = '/tmp/' + md5(username + password);

    // check the token age, create new one if it is expired.
    this.fetchTokens();
};

module.exports = Vitrium;

/**
 * get session token for connection.
 */
Vitrium.prototype.fetchTokens = function() {

    let self = this;

    // check if the token file exists.
    if(fs.existsSync(self.tokenFilePath)) {
        // check the modified time to calculate the age.
        let stats = fs.statSync(self.tokenFilePath);
        // age is in MS.
        let age = (new Date()).getTime() - stats.mtimeMs;
        if(age < 3600000) {
            // token is not expired yet!
            // read the token.
            let tokens = fs.readFileSync(self.tokenFilePath, 'utf8').split(',');
            self.accountToken = tokens[0]
            self.sessionToken = tokens[1]
            // write the same token to update modified time.
            fs.writeFileSync(self.tokenFilePath, 
                    self.accountToken + ',' + self.sessionToken, 'utf8');
        }
    }

    if(self.sessionToken === "") {
        // no sessionToken exists or it is expired, establish new session.
        console.log("Try to establish session");
        console.log(self.initAccountToken);
        self.estabilishSession((tokens, err) => {
            self.accountToken = tokens[0];
            self.sessionToken = tokens[1];
            // write the same token to update modified time.
            fs.writeFileSync(self.tokenFilePath,
                    self.accountToken + ',' + self.sessionToken, 'utf8');
        });
    }
};

/**
 * establish session to Vitrium server.
 */
Vitrium.prototype.estabilishSession = function(callback) {

    let self = this;

    // set up the request header.
    let headers = {};
    headers['X-VITR-ACCOUNT-TOKEN'] = self.initAccountToken;
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
            let tokens = [res.data.Accounts[0].Id, res.data.ApiSession.Token];

            // callback!
            callback(tokens);
        }).catch(function(err) {

            console.log(err);
            callback(null, err);
        });

    }).catch(function(error) {

        console.dir(error);
        callback(null, error);
    });
};

/**
 * utility function to get ready the get request.
 */
Vitrium.prototype.buildGetRequest = function(uri, offset, limit) {

    return {
        url: this.docApiBaseUrl + uri,
        method: 'get',
        headers: {
          'X-VITR-ACCOUNT-TOKEN': this.accountToken,
          'X-VITR-SESSION-TOKEN': this.sessionToken
        },
        params: {
          "page": {
             "index": offset,
             "size": limit
          }
        }
    };
};

/**
 * General api calls.
 * The callback will have 2 params: res, err.
 */
Vitrium.prototype.generalApiCall = function(req, callback) {

    axios.request(req).then(function(res) {

        //console.log(res);
        //console.log(res.config);
        //console.log(res.data);
        callback(res);
    }).catch(function(err) {

        console.log(err);
        callback(null, err);
    });
};

/**
 * quick method to get policy.
 *
 */
Vitrium.prototype.getPolicies = function(offset, limit, callback) {

    // get ready the request.
    let policyReq =
        this.buildGetRequest('Policy', offset, limit);

    //console.log(policyReq);
    this.generalApiCall(policyReq, callback);
};

/**
 * version unique for downloading binary file.
 */
Vitrium.prototype.versionUnique = function(docDetails, callback) {

    let self = this;

    // get ready the request.
    console.log("get ready the request!");
    let unique = {
        url: self.docApiBaseUrl + 'Version/Unique',
        method: 'post',
        // default is JSON type
        responseType: 'stream',
        headers: {
          'X-VITR-ACCOUNT-TOKEN': self.accountToken,
          'X-VITR-SESSION-TOKEN': self.sessionToken
        },
        data: docDetails
    };
    //console.log(unique);

    // call the unique APIs
    axios.request(unique).then(function(uniqueRes) {

        //console.log(uniqueRes.headers);
        callback(uniqueRes, null);
    }).catch(function(uniqueErr) {

        callback(null, uniqueErr);
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

