/**
 * simple test case to use Crea moduel.
 */

const Crea = require('./../../src/libs/crea');

const config = require('./../../src/config');

let crea = new Crea( config.crea.username, config.crea.password );

console.log(crea.apiUrls);

async function testGetCookie() {

    let cookie = await crea.authorize();

    console.log(cookie);
}

testGetCookie();
