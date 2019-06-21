/**
 * quick test to get connect to CREA service.
 */

const axios = require('axios');

// load configuration
const config = require('./../../src/config');
const localConfig = config.crea;

console.log(localConfig.loginUrl);
