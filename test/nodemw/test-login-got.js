/*  
    MediaWiki API Demos
    Demo of `Login` module: Sending post request to login
    update to use Got.
    https://github.com/sindresorhus/got
*/

const querystring = require('querystring');
const got = require('got');
const toughCookie = require('tough-cookie');

// we will execute the script by using nvm, for example:
// $ nvm run node test-login.js
const rawParams = process.argv.slice(2);
console.log(rawParams);

const url = "https://" + rawParams[0] + "/w/api.php";
console.log(url);

// set up a Got instance.
const cookieJar = new toughCookie.CookieJar();
const gotInstance = got.extend( {
    //cookieJar
} );

// Step 1: GET Request to fetch login token
function getLoginToken() {

    var params_0 = {
        action: "query",
        meta: "tokens",
        type: "login",
        format: "json"
    };

    let query = url + "?" + querystring.encode(params_0);
    console.log(query);

    gotInstance(query).
        then(res => {

            let data = JSON.parse(res.body);
            console.log(data); console.log(res.headers);
            console.log(cookieJar.getCookiesSync('https://' + rawParams[0]));
            loginRequest(data.query.tokens.logintoken,
                res.headers['set-cookie'][0].split("; ")[0]
            );
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
function loginRequest(login_token, auth_cookie) {

    var params_1 = {
        action: "login",
        // we need use bot user account here.
        lgname: rawParams[1],
        lgpassword: rawParams[2],
        lgtoken: login_token,
        format: "json"
    };

    gotInstance.post(url, {
        json: params_1,
        headers: {
            cookie: auth_cookie
        }
    }).
        then( response => {
            console.log(response.body);
            console.log(response.req.headers);
            console.log(response.headers);
        }).
        catch( error => {
            console.log(error);
        });
}

// Start From Step 1
getLoginToken();
