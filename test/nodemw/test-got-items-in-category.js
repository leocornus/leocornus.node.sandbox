
const querystring = require('querystring');
const got = require('got');
const toughCookie = require('tough-cookie');

// we will execute the script by using nvm, for example:
// $ nvm run node test-login-got.js
const rawParams = process.argv.slice(2);
console.log(rawParams);

const url = "https://" + rawParams[0] + "/w/api.php";
console.log(url);

// set up a Got instance with cookie jar.
// Got will handle all cookie related work.
const cookieJar = new toughCookie.CookieJar();
const gotInstance = got.extend( {
    cookieJar
} );


async function loginRequest() {

    // STEP 1: Get request to fetch login token
    var params_0 = {
        action: "query",
        meta: "tokens",
        type: "login",
        format: "json"
    };

    // use querystring to build the HTTP query string
    let query = url + "?" + querystring.encode(params_0);
    console.log(query);

    try {

        const tokenRes = await gotInstance.get( query );
        console.log( JSON.parse(tokenRes.body) );

        // get ready the loging POST request.
        var params_1 = {
            action: "login",
            // we need use bot user account here.
            lgname: rawParams[1],
            lgpassword: rawParams[2],
            lgtoken: JSON.parse(tokenRes.body).query.tokens.logintoken,
            format: "json"
        };

        const loginRes = await gotInstance.post( url, { form: params_1 } );
        console.log(loginRes.body);

    } catch (error) {

        console.log( error );
    }
}

loginRequest();
