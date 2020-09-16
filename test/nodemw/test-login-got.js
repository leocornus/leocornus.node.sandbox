/*  
    MediaWiki API Demos
    Demo of `Login` module: Sending post request to login
    update to use Got.
*/

const got = require('got');

// we will execute the script by using nvm, for example:
// $ nvm run node test-login.js
const rawParams = process.argv.slice(2);
console.log(rawParams);

const url = "https://" + rawParams[0] + "/w/api.php";
console.log(url);

// Step 1: GET Request to fetch login token
function getLoginToken() {

    var params_0 = {
        action: "query",
        meta: "tokens",
        type: "login",
        format: "json"
    };

    let query = url + "?";
    Object.keys(params_0).forEach( key => {
        query += "&" + key + "=" + params_0[key];
    });

    got(query).
        then(res => {

            console.log(res.body);
            //loginRequest(res.body.query.tokens.logintoken);
        }).
        catch(error => {

            console.log(error);
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

    request.post({ url: url, form: params_1 }, function (error, res, body) {
        if (error) {
            return;
        }
        console.log(body);
        console.log(res);
    });
}

// Start From Step 1
getLoginToken();
