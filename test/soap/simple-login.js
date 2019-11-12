/**
 * simple test case to use SOAP lib.
 */

const soap = require('soap');
const log4js = require('log4js');

const config = require('./../../src/config');
const localConfig = config.soap;
// configure log4js
log4js.configure(localConfig.log4jsConfig);

// quick test for sync login
soap.createClient(localConfig.baseUrl, function(error, client) {

    //console.log(client);

    let loginCred = 
        {"username": localConfig.username,
         "password": localConfig.password};
    return client.login(loginCred, function(err, result) {

        console.log("Sync login result:", result);
    });
});
