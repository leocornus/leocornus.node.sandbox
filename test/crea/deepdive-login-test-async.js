/**
 * quick test to get connect to CREA service.
 */

const axios = require('axios');
const request = require('request');
const md5 = require('crypto-js/md5');
const parseXml = require('xml2js').parseString;

// load configuration
const config = require('./../../src/config');
const localConfig = config.crea;

console.log(localConfig.loginUrl);

let cookie = testLogin();
console.log(cookie);

async function testLogin() {

    try {
        // we expect it will fail!
        await axios.get(localConfig.loginUrl);
    } catch (error) {

        console.log(error.response.headers);

        // get the authentication params
        var challengeHeaders = error.response.headers['www-authenticate'];
        var challengeCookie = error.response.headers['set-cookie'][0].split('; ')[0];
        var challengeParams = challengeHeaders.substring(7).split( ', ' ).
            // convert an arry to a Object.
            reduce( (params, item) => {

                if( item.startsWith('nonce') ) {
                    var parts = item.split('nonce=');
                    params['nonce'] = parts[1].replace(/"/g, '');
                } else {
                    var parts = item.split('=');
                    params[parts[0]] = parts[1].replace(/"/g, '');
                }
                return params;
            }, {} );
        console.dir(challengeParams);

        // calculate Authorization digest string.
        var ha1 = md5(localConfig.username + ':' + 
                      challengeParams.realm + ':' + localConfig.password)
        var ha2 = md5('GET:' + localConfig.loginUrl)
        var response = md5(ha1 + ':' + challengeParams.nonce + ':1::auth:' + ha2)
        var authParams = {
          username : localConfig.username,
          realm : challengeParams.realm,
          nonce : challengeParams.nonce,
          uri : localConfig.loginUrl, 
          qop : challengeParams.qop,
          response : response,
          nc : '1',
          cnonce : '',
        };

        // stringify the params:
        var authParamStr = Object.keys(authParams).reduce( (paramStr, key) => {
            return paramStr + ', ' + key + '="' + authParams[key] + '"';
        }, '' );
        authParamStr = 'Digest ' + authParamStr.substring(2);
        console.log(authParamStr);
        var authOptions = {
            headers: {
                "Authorization": authParamStr,
                "Cookie": challengeCookie
            }
        };

        try {
            let authRes = await axios.get(localConfig.loginUrl, authOptions);
            let authCookie = authRes.headers['set-cookie'][0].split('; ')[0];
            challengeParams['cookie'] = challengeCookie + "; " + authCookie;
            console.log(challengeParams);
            return challengeParams;
        } catch( authErr ) {
            console.error(authErr);
            throw Error(authErr);
        }
    }
}
