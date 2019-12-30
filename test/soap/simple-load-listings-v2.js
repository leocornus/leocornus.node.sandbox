/**
 * simple test case to use SOAP lib.
 * version 2.0 the updated version
 */

const soap = require('soap');
const log4js = require('log4js');
const prettyMs = require('pretty-ms');

const parseCsv = require('csv-parse');
const axios = require('axios');
const strategy = require('./../../src/libs/strategy');
const ihf = require('./../../src/libs/ihf');

const config = require('./../../src/config');
const localConfig = config.soap;
// configure log4js
log4js.configure(localConfig.log4jsConfig);

// track how long it will take.
const startTime = new Date();

// the login credential.
let loginCred = {
    "username": localConfig.username,
    "password": localConfig.password
};

// quick test for sync login
soap.createClient(localConfig.baseUrl, function(error, client) {

    //console.log(client);

    client.login(loginCred, function(err, result) {

        // here is the full callback function.
        // function(err, result, rawResponse, soapHeader, rawRequest)
        // result is a javascript object
        // rawResponse is the raw xml response string
        // soapHeader is the response soap header as a javascript object
        // rawRequest is the raw xml request string

        console.log("Sync login result:", result);

        // get ready the context.
        let context = {context: result["return"]};
        // call getBoards
        client.getBoards(context, function(boardErr, boards) {

            console.log("sync Available Boards:", boards);
            context['boardID'] = boards["return"][0];
            console.log("Context:", context);

            // the header for the CSV listings
            let csvHeader = '';
            client.getHeaders(context, function(headerErr, headers) {
                csvHeader = headers["return"];
                // adding prefix for each header.
                csvHeader = csvHeader.map( (header) => "i_" + header );
                console.log("Headers:", csvHeader.join(","));

                // set the while done condition.
                let doneCondition = function(total, subTotal) {

                    console.log("Complete progress:", total);

                    if(subTotal < 0) {
                        // error happen.
                        // consider as DONE!
                        return true;
                    } else if(subTotal < localConfig.limitPerCall) {
                        // normal complete.
                        return true;
                    } else {
                        return false;
                    }
                };

                // set the while function.
                let batchFunction = function(index, reportBatch) {
                    ihf.getBatchListings(index, client, context, csvHeader, reportBatch, localConfig);
                };

                strategy.waterfallWhile(doneCondition, batchFunction, function() {

                    console.log("While loop complete!");
                    let endTime = new Date();
                    console.log("Running time:", prettyMs(endTime - startTime));
                });
            });
        });
    });
});
