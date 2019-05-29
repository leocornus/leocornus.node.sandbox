/**
 * quick test to get connect to Tika server.
 *
 * Overview about Tika server:
 * - https://wiki.apache.org/tika/TikaJAXRS
 */

const axios = require('axios');
const fs = require('fs');

// load configuration
const config = require('./../../src/config');
const localConfig = config.tika;

// simple get.
axios.get(localConfig.baseUrl + "tika", {})
.then(function(res) {
    console.dir(res.data);
})
.catch(function(err) {
    console.dir(err);
});

// try the multipart/form-data POST request.
let multipartPost = {
    method: 'post',
    url: localConfig.baseUrl + 'meta/form',
    data: {
        file: fs.createReadStream('/datadrive/tmp/csa-2409870.pdf')
    },
    headers: {
        "Accept": "application/json",
        "Content-Type": "multipart/form-data"
    }
}
axios.request(multipartPost).then(function(mRes) {
    console.dir(mRes.data);
}).catch(function(mErr) {
    //console.dir(mErr);
    console.log(mErr.response.data);
});
