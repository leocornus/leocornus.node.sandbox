/**
 * quick test to get connect to Tika server.
 *
 * Overview about Tika server:
 * - https://wiki.apache.org/tika/TikaJAXRS
 */

const axios = require('axios');

// load configuration
const config = require('./../../src/config');
const localConfig = config.tika;

axios.get(localConfig.baseUrl + "tika", {})
.then(function(res) {
    console.dir(res);
})
.catch(function(err) {
    console.dir(err);
});
