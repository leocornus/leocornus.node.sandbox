/*  
    edit.js
 
    MediaWiki API Demos
    Demo of `Login` module: Sending post request to login
    MIT license
*/

const axios = require('axios');

// we will execute the script by using nvm, for example:
// $ nvm run node test-login.js
const rawParams = process.argv.slice(2);
console.log(rawParams);

const url = "https://" + rawParams[0] + "/w/api.php";
console.log(url);

let mwclient = axios.create({
    baseURL: url
});

// Step 1: GET Request to fetch login token
function getLoginToken() {
    var params_0 = {
        action: "query",
        meta: "tokens",
        type: "login",
        format: "json"
    };

    mwclient.get(url, {params: params_0 }).
        then(function (response) {

            //console.log(response);
            console.log(response.data);
            loginRequest(response.data.query.tokens.logintoken);
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

    mwclient.post(url, params_1).
        then(function(res) {

            //console.log(res.data);
            console.log("Login success!");
            //console.table(Object.keys(res));
            //console.table(Object.keys(res.request));
            //console.table(res.config);
            console.log(res.data);
        }).
        catch(function(error) {
            console.log( error );
            return;
        });
}

// Start From Step 1
getLoginToken();
