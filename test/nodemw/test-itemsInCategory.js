/*  
    edit.js
 
    MediaWiki API Demos
    Demo of `Login` module: Sending post request to login
    MIT license
*/

const request = require('request').defaults({jar: true});

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

    request.get({ url: url, qs: params_0 }, function (error, res, body) {
        if (error) {
            return;
        }
        var data = JSON.parse(body);
        loginRequest(data.query.tokens.logintoken);
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
        // getCsrfToken();
        getCategoryItems('', rawParams[3] );
    });
}

// Step 3: GET request to fetch CSRF token
function getCsrfToken() {
    var params_2 = {
        action: "query",
        meta: "tokens",
        format: "json"
    };

    request.get({ url: url, qs: params_2 }, function(error, res, body) {
        if (error) {
            return;
        }
        var data = JSON.parse(body);
        console.log(data);
        getCategoryItems(data.query.tokens.csrftoken, rawParams[3]);
    });
}

function getCategoryItems(token, category) {

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

    request.get({url: url, qs: params_3}, (error, response, body) => {
        if(error) {
            console.log(error);
        }
        //console.log(response);
        console.log("==================================");
        console.log(body);

        // NOTE:
        // need parse body to JSON format.
        JSON.parse(body).query.categorymembers.forEach( item => {
            console.log( `${item.pageid}: ${item.title}` );
        });
    });
}

// Start From Step 1
getLoginToken();

