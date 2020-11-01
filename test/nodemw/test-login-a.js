/*  
    edit.js
 
    MediaWiki API Demos
    Demo of `Login` module: Sending post request to login
    MIT license
*/

/**
 * NOTE:
 *
 * I have try to using axios to do what request is doing.
 * However, axios does NOT support cookie.
 * It will be really hard to use axio to login MediaWiki.
 *
 * Swith to use Got.js
 */

const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');

// we will execute the script by using nvm, for example:
// $ nvm run node test-login.js
const rawParams = process.argv.slice(2);
console.log(rawParams);

const url = "https://" + rawParams[0] + "/w/api.php";
console.log(url);

let mwclient = axios.create({
    baseURL: url
});

// set cookiejar support
axiosCookieJarSupport(mwclient);
mwclient.defaults.jar = new tough.CookieJar();

// Step 1: GET Request to fetch login token
function getLoginToken() {
    var params_0 = {
        action: "query",
        meta: "tokens",
        type: "login",
        format: "json"
    };

    mwclient.get(url, {
        params: params_0,
        withCredentials: true
    }).
        then(function (response) {

            //console.log(response);
            console.log(response.data);
            loginRequest(response.data.query.tokens.logintoken);
            console.table(mwclient.defaults.jar);
        }).
        catch(function(error) {
            console.log( error );
            return;
        });
}

// Step 2: POST Request to log in. 
// Use of main account for login is not
// supported. Obtain credentials via Special:BotPasswords
// (https://www.mediawiki.org/wiki/Special:BotPasswords) for lgname & lgpassword
function loginRequest(login_token) {

    var params_1 = {
        action: "login",
        // we need use bot user account here.
        lgname: rawParams[1],
        lgpassword: rawParams[2],
        lgtoken: login_token,
        format: "json"
    };

    mwclient.post(url, params_1, {withCredentials: true}).
        then(function(res) {

            //console.log(res.data);
            //console.log("Login success!");
            //console.table(Object.keys(res));
            //console.table(Object.keys(res.request));
            //console.table(res.config);
            //console.log(res.config);
            getCategoryItems(rawParams[3]);
        }).
        catch(function(error) {
            console.log( error );
            return;
        });
}

function getCategoryItems(category) {

    let params_3 = {
        action: "query",
        list: "categorymembers",
        cmtitle: "Category:" + category,
        cmlimit: "5",
        //token: token,
        format: "json"
    };

    let query = url + "?origin=*";
    Object.keys(params_3).forEach( key => {
        query += "&" + key + "=" + params_3[key];
    });
    console.log(query);

    mwclient.get(url, {
        params: params_3,
        withCredentials: true
    }).then( res => {

        console.log(res.data);
        // NOTE:
        // need parse body to JSON format.
        //JSON.parse(body).query.categorymembers.forEach( item => {
        //    console.log( `${item.pageid}: ${item.title}` );
        //});

    }).catch( error => {
        console.log(error);
    });
}

// Start From Step 1
getLoginToken();
