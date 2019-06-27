/**
 * quick test to get connect to CREA service.
 */

const axios = require('axios');
const md5 = require('crypto-js/md5');

// load configuration
const config = require('./../../src/config');
const localConfig = config.crea;

console.log(localConfig.metadataUrl);

// get ready the Authorization digest string.
var ha1 = md5(localConfig.username + ':' + 
              localConfig.sampleDigest.realm + ':' + localConfig.password);
var ha2 = md5('GET:' + localConfig.metadataUrl);
var response = md5(ha1 + ':' + localConfig.sampleDigest.nonce + ':1::auth:' + ha2);
var authParams = {
  username : localConfig.username,
  realm : localConfig.sampleDigest.realm,
  nonce : localConfig.sampleDigest.nonce,
  uri : localConfig.metadataUrl, 
  qop : localConfig.sampleDigest.qop,
  response : response,
  nc : '1',
  cnonce : '',
};

// stringify the params:
var authParamStr = Object.keys(authParams).reduce( (paramStr, key) => {
    return paramStr + ', ' + key + '="' + authParams[key] + '"';
}, '' );
authParamStr = 'Digest ' + authParamStr.substring(2);

// GET request options.
var getMetadata = {
    params: {
        Type: 'METADATA-CLASS',
        //Format: 'Standard-XML',
        Format: 'COMPACT',
        //ID: '*',
        ID: '0',
    },
    headers: {
        Authorization: authParamStr,
        Cookie: localConfig.sampleDigest['cookie']
    }
};

axios.get(localConfig.metadataUrl, getMetadata)
    .then(function(response) {

        console.dir(response.headers);
        console.dir(response.data);
        console.log('Success');
    }).catch(function(error) {
        console.dir(error);
        console.log('Failed!');
    });
