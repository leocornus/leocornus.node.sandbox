/**
 * simple test case to use SOAP lib.
 */

const soap = require('soap');
const log4js = require('log4js');
const parseXml = require('xml2js').parseString;
const parseCsv = require('csv-parse');
const axios = require('axios');
const strategy = require('./../../src/libs/strategy');

const config = require('./../../src/config');
const localConfig = config.soap;
// configure log4js
log4js.configure(localConfig.log4jsConfig);
const solrUpdate = localConfig.solrUrl + "update/json/docs?commit=true";

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
                    getBatchListings(index, client, context, csvHeader, reportBatch);
                };

                strategy.waterfallWhile(doneCondition, batchFunction, function() {

                    console.log("While loop complete!");
                });
            });
        });
    });
});

/**
 * utility function to get a batch of listtings.
 */
function getBatchListings(index, soapClient, context, csvHeader, reportDone) {

    if( index === 0 ) {

        // get listing data.
        soapClient.getAllListings(context, function(allError, listingsXml) {
            // check the error first.
            if(allError) {
                // report error.
                console.log("Failed to call getAllListings:", allError);
                reportDone(-1);
            }

            // we should have response successfully
            // process the listing data.
            processListingsData(listingsXml, csvHeader, reportDone);
        });
    } else {

        // get listing data.
        soapClient.getListingsSince(context, function(allError, listingsXml) {
            // check the error first.
            if(allError) {
                // report error.
                console.log("Failed to call getListingsSince:", allError);
                reportDone(-1);
            }

            // we should have response successfully
            // process the listing data.
            processListingsData(listingsXml, csvHeader, reportDone);
        });
    }
}

/**
 * utility function to process listings data.
 */
function processListingsData(listingsXml, csvHeader, reportDone) {

    // listings are in xml format. parse it to JSON format.
    //console.log("Listings:", listingsXml["return"]);
    parseXml(listingsXml['return'], function(parseErr, listings) {

        // check if we have parse error!
        if(parseErr) {
            // report the parse error.
            console.log("XML Parse Error:", parseErr);
            reportDone(-1);
        }

        // data is in CSV format.
        // add headers to include columns' name.
        let listingsCSV = csvHeader.join(",") + "\r\n" +
            listings.Listings.Data[0];
        //console.log("Listings data in CSV format: ", listingsCSV);
        console.log("listing total:", listings.Listings.Count[0]);

        // parse CSV files.
        parseCsv( listingsCSV,
            // turn on the columns,
            // so the JSON output will be in Object format
            // with column name.
            {columns: true}, function(err, output) {

            if(err) {
                console.log('Parse CSV Error:', err);
                reportDone(-1);
            }

            console.log("Total row:", output.length);

            // set the batch async iterator
            let asyncPost = function(batchItems, reportPostDone) {
                // tweak the docs to Solr.
                let payload = localConfig.tweakDocs(batchItems);
                axios.post(solrUpdate, payload)
                .then(function(solrRes) {

                    console.log("Batch post success");
                    reportPostDone(batchItems.length);
                }).catch(function(solrErr) {

                    console.log("Batch post Failed:", solrErr);
                    reportPostDone(batchItems.length);
                });
            };

            // batch over outputs.
            strategy.iterateOverBatch(output, localConfig.solrPostBatchSize,
                asyncPost, 
                function() {
                    // all output are posted.
                    console.log("Solr post complete!");
                    reportDone(output.length);
                }
            );
        });
    });
}
