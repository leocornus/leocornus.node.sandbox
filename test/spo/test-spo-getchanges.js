/**
 * testing the getChanges REST API.
 *
 */

const spoAuth = require('node-sp-auth');
const axios = require('axios');
// we have to use the ./ as current foler.
const config = require('./../../src/config');
const spoConfig = config.spo;

// try to get access headers
spoAuth.getAuth(spoConfig.spoUrl, 
            {username: spoConfig.username, password: spoConfig.password})
.then(options => {

    let headers = options.headers;
    headers['Accept'] = 'application/json';
    //console.log(headers);

    // root folder
    let reqChanges = {
        // need permission to execute this request.
        //url: spoConfig.spoUrl + spoConfig.spoSite + "/_api/web/getchanges",
        url: spoConfig.spoUrl + spoConfig.spoSite + "/_api/web/eventreceivers",
        method: "get",
        headers: headers
    };

    // call the API to get response.
    axios.request(reqChanges).then(function(response) {

        //console.log(response.data.value);
        let receivers = response.data.value;
        receivers.forEach((receiver) => {
            console.log(receiver.ReceiverClass);
        });
    })
    .catch(function(errRes) {
        consol.log(errRes.data);
    });
});
