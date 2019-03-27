"use strict";

/**
 * provide a set of simple search APIs
 */

const axios = require('axios');

/**
 * using the function expressions to define the class.
 *
 * This fuunction is actually works as a constructor.
 */
const Search = function Search (baseUrl) {

    // base url to access Vitrium documents.
    this.searchUrl = baseUrl + 'select';
};

// export the Vitrium module.
module.exports = Search;

/**
 * show information about search server.
 */
Search.prototype.info = function() {

    return {
        endpoint: this.searchUrl
    };
};

/**
 * the basic select function.
 */
Search.prototype.select = function(query, callback) {

    let selectQuery = {
        params: {
            q: "*:*"
        }
    };

    axios.get(this.searchUrl, selectQuery)
    .then(function(response) {
        console.log(response);
        callback(response, null);
    })
    .catch(function(error) {
        callback(null, error);
    });
};
