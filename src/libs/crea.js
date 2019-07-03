"use strict";

/**
 * utilities to manipulate CREA RET APIs.
 */
// get log4j logger.
const logger = require('log4js').getLogger('crea');

const axios = require('axios');
const md5 = require('crypto-js/md5');

const fs = require('fs');

/**
 * using the function expressions to define the class.
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function
 *
 * This fuunction is actually works as a constructor.
 */
const Crea = function Crea (username, password) {

    // base url to access crea.ca.
    this.apiBaseUrl = 'https://data.crea.ca/';
    this.apiUrls = {
        'Login': this.apiBaseUrl + 'Login.svc/Login',
        'Logout': this.apiBaseUrl + 'Logout.svc/Logout',
        'Search': this.apiBaseUrl + 'Search.svc/Search',
        'GetObject': this.apiBaseUrl + 'Object.svc/GetObject',
        'GetMetadata': this.apiBaseUrl + 'Metadata.svc/GetMetadata'
    };

    // set the instance property.
    this.realm = '';
    this.nonce = '';
    this.qop = '';
    this.cookie = '';

    // local file to store the API session token.
    this.cookieFilePath = '/tmp/' + md5(username + password);

    // check the token age, create new one if it is expired.
    // set it as a promise object.
    this._authorized = this.authorize();
    logger.info( `Current session: ${this.cookie}` );
};

// export the crea module.
module.exports = Crea;

/**
 * Challenge the server and get authorized.
 */
Crea.prototype.authorize = async function() {

    let self = this;

}
