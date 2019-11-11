/**
 * simple test case to use SOAP lib.
 */

const soap = require('soap');
const log4js = require('log4js');

const config = require('./../../src/config');
const localConfig = config.soap;
// configure log4js
log4js.configure(localConfig.log4jsConfig);

soap.createClientAsync(localConfig.baseUrl)
.then( (client) => {

    //console.log(client);
    client.login({"username": localConfig.username,
                  "password": localConfig.password})
})
.then( (result) => {
    console.log("login result:", result);
});
