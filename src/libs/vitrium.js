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
    // set it as a promise object.
    this._initialized = this.fetchTokens();
    console.log(`Current session: ${this.sessionToken}`);
};

// export the Vitrium module.
module.exports = Vitrium;

/**
 * get session token for connection.
 */
Vitrium.prototype.fetchTokens = async function() {

    let self = this;

    // using the try catch block to make sure we return the fulfill
    // or error for the Promise, we are using the async function.
    try {
        // check if the token file exists.
        if(fs.existsSync(self.tokenFilePath)) {
            // check the modified time to calculate the age.
            let stats = fs.statSync(self.tokenFilePath);
            // age is in MS.
            let age = (new Date()).getTime() - stats.mtimeMs;
            if(age < 3600000) {
                // token is not expired yet!
                // read the token.
                const tokens = fs.readFileSync(self.tokenFilePath, 'utf8').split(',');
                // set tokens.
                self.accountToken = tokens[0];
                self.sessionToken = tokens[1];
            }
        }

        // no sessionToken exists or it is expired, estabilish new session.
        if(self.sessionToken === "") {
            console.log("Try to estabilish session");
            console.log(self.initAccountToken);
            // async function always return a promise,
            // whether you use await or not
            const tokens = await self.estabilishSessionSync();
            // set tokens here too after the estabilish session fulfilled.
            self.accountToken = tokens[0]
            self.sessionToken = tokens[1]
        }

        if(self.sessionToken === "") {
            // try again.
            // TODO: set timeout!
            const token = await self.fetchTokens();
        } else {
            // write the same tokens to update modified time.
            fs.writeFileSync(self.tokenFilePath, 
                    self.accountToken + ',' + self.sessionToken, 'utf8');
        }

        // return will fulfill the async function promise.
        return self.sessionToken;
    } catch(err) {
        console.log(err);
        throw Error(err);
    }
};

/**
 * wait until the session is estabilished.
 */
Vitrium.prototype.estabilishSessionSync = async function() {

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

    try {
        // challenge to get ServerNonce.
        // suppose wait for the axios promise fulfilled.
        const challengeRes = await axios.request(reqConf);

        // collect server Nonce
        console.dir(challengeRes.data);
        let serverNonce = challengeRes.data.ServerNonce;

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

        const loginRes = await axios.request(reqConf);

        console.log(loginRes.data);
        // update headers with new tokens.
        // TODO: check to make sure the reponse has new tokens
        let tokens = [loginRes.data.Accounts[0].Id,
                      loginRes.data.ApiSession.Token];
        return tokens;
    } catch (awaitError) {
        console.log(awaitError);
    }
};

/**
 * estabilish session to Vitrium server.
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
 * utility fucntion to build the query parameters.
 *
 * params: the input parameters object.
 */
Vitrium.prototype.buildQueryParams = function(params) {

    let queryParams = {};

    // pagination prarms.
    if(params.hasOwnProperty('offset') && params.hasOwnProperty('limit')) {
        queryParams["page"] = {
            "index": params["offset"],
            "size": params["limit"]
        }
    }

    // document id.
    if(params.hasOwnProperty('documentId')) {
        queryParams['documentId'] = params['documentId'];
    }

    return queryParams;
}

/**
 * utility function to get ready the get request.
 */
Vitrium.prototype.buildGetRequest = function(baseUrl, uri, queryParams) {

    return {
        url: baseUrl + uri,
        method: 'get',
        headers: {
          'X-VITR-ACCOUNT-TOKEN': this.accountToken,
          'X-VITR-SESSION-TOKEN': this.sessionToken
        },
        params: queryParams
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
 * the generic function to get multiple items for a topic.
 * this will be Get request only.
 */
Vitrium.prototype.getMultiItems = function(topic, params, callback) {

    const queryParams = this.buildQueryParams(params);

    // get ready the request.
    let itemsReq =
        this.buildGetRequest(this.docApiBaseUrl, topic, queryParams);

    //console.log(policyReq);
    this.generalApiCall(itemsReq, callback);
};

/**
 * the generic function to get multiple items for a topic.
 * this will be Get request only.
 */
Vitrium.prototype.getSMultiItems = function(topic, params, callback) {

    const queryParams = this.buildQueryParams(params);

    // get ready the request.
    let itemsReq =
        this.buildGetRequest(this.securityApiBaseUrl, topic, queryParams);

    //console.log(policyReq);
    this.generalApiCall(itemsReq, callback);
};

/**
 * quick method to get policy.
 *
 */
Vitrium.prototype.getPolicies = async function(offset, limit, callback) {

    await this._initialized;
    this.getMultiItems('Policy', {"offset":offset, "limit":limit}, callback);
};

/**
 * quick method to get Readers.
 */
Vitrium.prototype.getReaders = async function(offset, limit, callback) {

    await this._initialized;
    // readers request.
    this.getSMultiItems('Reader', {"offset":offset, "limit":limit}, callback);
};

/**
 * get a page of docs.
 */
Vitrium.prototype.getDocs = async function(offset, limit, callback) {

    await this._initialized;
    this.getMultiItems('Doc', {"offset":offset, "limit":limit}, callback);
};

/**
 * get versions for a doc.
 */
Vitrium.prototype.getDocVersions = async function(docId, offset, limit, callback) {

    await this._initialized;
    const params = {
        "documentId": docId,
        "offset": offset,
        "limit": limit
    }
    this.getMultiItems('Version', params, callback);
};

/**
 * quick method to get folders by page.
 */
Vitrium.prototype.getFolders = async function(offset, limit, callback) {

    await this._initialized;
    // readers request.
    this.getMultiItems('Folder', {"offset":offset, "limit":limit}, callback);
};

/**
 * utility class to build details payload for a document.
 * Here is sample of the doc request.
 *
 * {
 *    "DocCode": "2090-13A1-3DE9E-00064067",
 *    "UserName": "someemail@gmail.com",
 *    "UserSetType": "Retail",
 *    "PolicyExceptionOverrideCode": null,
 *    "DocExpiryDate": "2069-12-31",
 *    "IPAddressRange": null
 * }
 */
Vitrium.prototype.buildDocDetails = function(docRequest) {

    // the default doc policy override,
    let docPolicyOverride = {
        "PrintType": "HighResolution",
        "AllowAnnotations": false,
        "AllowCopy": true,
        "AllowBuildInLoginTemplate": true,
        "AcroJsGosUnlimitedBehaviourType": "PromptAndCloseDocument",
        "AcroJsGosBehaviorType": "PromptAndCloseDocument"
    };

    // parse and process the DocExpiryDate, format: YYYY-MM-DD
    // follow the ISO 8601 calendar date extended format, the date-only form.
    // It will be considered as UTC.
    const docExpiryDate = new Date(docRequest.DocExpiryDate);
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.round((docExpiryDate - new Date()) / msPerDay);
    const docExpriyInMins = (days + 1) * 24 * 60;

    // the default access policy override.
    let accessPolicyOverride = {
        "RelativeExpiryInDays": null,
        "OpenLimit": null,
        "OfflineDurationinDays": 18250,
        "IpAddressesMax": null,
        "IgnoredIpAddresses": null,
        // 525600 mins is 1 year, which is max
        "ExpiryInMins": Math.min(525600, docExpriyInMins),
        "DocumentLimit": 1,
        "ComputersMax": 2
    };


    // set policies based on the UserSetType:
    switch(docRequest.UserSetType) {
        case 'Retail':
            docPolicyOverride.AllowAnnotations = true;
            accessPolicyOverride.OfflineDurationinDays = 18250;
            // allow max 50 years which is 262840000 mins
            accessPolicyOverride.ExpiryInMins =
                Math.min(262840000, docExpriyInMins);
            break;
        case 'Subscription-User':
            docPolicyOverride.AllowAnnotations = true;
            // 30 offline days
            accessPolicyOverride.OfflineDurationinDays = 30;
            break;
        case 'Subscription-IP Generic':
            docPolicyOverride.PrintType = 'NotAllowed';
            docPolicyOverride.AllowCopy = false;
            docPolicyOverride.AllowAnnotations = false;
            // disable offline access.
            accessPolicyOverride.OfflineDurationinDays = -1;
            accessPolicyOverride.IpAddressesMax = 0;
            accessPolicyOverride.IgnoredIpAddresses =
                docRequest.IPAddressRange;
            break;
        case 'Subscription-IP Corp':
            docPolicyOverride.PrintType = 'HighResolution';
            docPolicyOverride.AllowCopy = true;
            docPolicyOverride.AllowAnnotations = true;
            accessPolicyOverride.OfflineDurationinDays = 30;
            accessPolicyOverride.IpAddressesMax = 0;
            accessPolicyOverride.IgnoredIpAddresses =
                docRequest.IPAddressRange;
            break;
        case 'Subscription-IP University':
            docPolicyOverride.PrintType = 'NotAllowed';
            docPolicyOverride.AllowCopy = true;
            docPolicyOverride.AllowAnnotations = true;
            // disable offline access.
            accessPolicyOverride.OfflineDurationinDays = -1;
            accessPolicyOverride.IpAddressesMax = 0;
            accessPolicyOverride.IgnoredIpAddresses =
                docRequest.IPAddressRange;
            break;
        case 'Subscription-IP College':
            docPolicyOverride.PrintType = 'NotAllowed';
            if(docRequest.PolicyExceptionOverrideCode === "College") {
                docPolicyOverride.AllowCopy = false;
                docPolicyOverride.AllowAnnotations = false;
            } else {
                docPolicyOverride.AllowCopy = true;
                docPolicyOverride.AllowAnnotations = true;
            }
            // disable offline access.
            accessPolicyOverride.OfflineDurationinDays = -1;
            accessPolicyOverride.IpAddressesMax = 0;
            accessPolicyOverride.IgnoredIpAddresses =
                docRequest.IPAddressRange;
            break;
        default:
            break;
    }

    let docDetails = {
      "DocCode": docRequest.DocCode,
      "UserName": docREquest.UserName,
      // generate the uniqu doc copy id.
      "UniqueDocCopyId": uuidv4(),
      "DocPolicyOverride": docPolicyOverride,
      "AccessPolicyOverride": accessPolicyOverride
    };

    return docDetails;
};

/**
 * version unique for downloading binary file.
 */
Vitrium.prototype.versionUnique = async function(docReq, callback) {

    let self = this;

    await self._initialized;

    let docDetails = self.buildDocDetails(docReq);

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
    console.log(unique);

    // call the unique APIs
    axios.request(unique).then(function(uniqueRes) {

        //console.log(uniqueRes.headers);
        callback(uniqueRes, null);
    }).catch(function(uniqueErr) {

        callback(null, uniqueErr);
    });
};
