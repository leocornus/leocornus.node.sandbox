/**
 * some utility functions for IHF rest APIs
 *
 * using csv-parse to parse CSV file
 */

const fs = require('fs');

const parseXml = require('xml2js').parseString;
const parseCsv = require('csv-parse');
const prettyMs = require('pretty-ms');
const axios = require('axios');

const strategy = require('./strategy');

let ihf = {

    /**
     * function to get a batch of listtings.
     */
    getBatchListings: function(index, soapClient, context, csvHeader,
	                           reportBatchDone, localConfig) {

	    let self = this;

        if( index === 0 ) {

            // get listing data.
            soapClient.getAllListings(context, function(allError, listingsXml) {
                // check the error first.
                if(allError) {
                    // report error.
                    console.log("Failed to call getAllListings:", allError);
                    reportBatchDone(-1);
                }

                // we should have response successfully
                // process the listing data.
                self.processListingsData(listingsXml, csvHeader, reportBatchDone, localConfig);
            });
        } else {

            // get listing data.
            soapClient.getListingsSince(context, function(allError, listingsXml) {
                // check the error first.
                if(allError) {
                    // report error.
                    console.log("Failed to call getListingsSince:", allError);
                    reportBatchDone(-1);
                }

                // we should have response successfully
                // process the listing data.
                self.processListingsData(listingsXml, csvHeader, reportBatchDone, localConfig);
            });
        }
    },

    /**
     * utility function to process listings data.
     */
    processListingsData: function(listingsXml, csvHeader, reportBatchDone, localConfig) {

        // listings are in xml format. parse it to JSON format.
        //console.log("Listings:", listingsXml["return"]);
        parseXml(listingsXml['return'], function(parseErr, listings) {

            // check if we have parse error!
            if(parseErr) {
                // report the parse error.
                console.log("XML Parse Error:", parseErr);
                reportBatchDone(-1);
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
                    reportBatchDone(-1);
                }

                console.log("Total row:", output.length);

                // set the batch async iterator
                let asyncPost = function(batchItems, reportPostDone) {

                    // tweak the docs to Solr.
                    let payload = localConfig.tweakDocs(batchItems);

					// post to Solr
                    axios.post(localConfig.solrUpdate, payload)
                    .then(function(solrRes) {

                        //console.log("Batch post success");
                        reportPostDone(batchItems.length);
                    }).catch(function(solrErr) {

                        console.log("Batch post Failed:", solrErr);
                        reportPostDone(batchItems.length);
                    });
                };

                // batch over outputs.
                strategy.iterateOverBatch(output, localConfig.solrPostBatchSize,
                    asyncPost, function() {

                        // all output are posted.
                        console.log("Solr post complete!");
                        reportBatchDone(output.length);
                    }
                );
            });
        });
    },

    /**
     * process all csv files in one folder.
     */
    processOneFolder: function(theFolder, reportOneFolderDone, localConfig) {

        let self = this;

        let startTime = new Date();
        console.log(theFolder);
        // get all files in the filder.
        let files = fs.readdirSync(theFolder);
        // set the waterfall iterator to process each file one after another.
        let waterfallIterator = function(index, reportOneFile) {

            let oneFile = files[index];
            self.processOneFile(theFolder + "/" + oneFile, reportOneFile,
                                localConfig);
        }
        // waterfall iterate through all files.
        strategy.waterfallOver(0, files.length, waterfallIterator, function() {

            console.log("Process all files for folder:", theFolder);
            let totalTime = (new Date()) - startTime;
            console.log("====Running time:", prettyMs(totalTime));
            reportOneFolderDone(1);
        });
    },

    /**
     * process one csv file a time.
     */
    processOneFile: function(theFile, reportOneFileDone, localConfig) {

        let self = this;

        console.log("--", theFile);
        // read the file content
        let listingsCSV = fs.readFileSync(theFile);

        // adding header.
        listingsCSV = localConfig.ihfCsvHeader.join(",") + "\n" + listingsCSV;
        // parse csv content
        parseCsv( listingsCSV,
            // turn on the columns,
            // so the JSON output will be in Object format
            // with column name.
            {columns: true}, function(err, output) {

            if(err) {
                console.log('Parse CSV Error:', err);
                reportOneFileDone(1);
            }

            console.log("Total row:", output.length);

            // set the batch async iterator
            let asyncPost = function(batchItems, reportPostDone) {
                // tweak the docs to Solr.
                let payload = localConfig.tweakDocs(batchItems, theFile);
                // TODO: query ihf hash to find identical docs. and skip them.
                axios.post(localConfig.solrUpdate, payload)
                .then(function(solrRes) {

                    //console.log("Batch post success");
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
                    reportOneFileDone(1);
                }
            );
        });
    },

    /**
     * construct the folder path for the given date.
     */
    constructFolderPath: function( oneDay ) {

        return [oneDay.getFullYear(), 
                this.padNumber( oneDay.getMonth() + 1, 2 ),
                [oneDay.getFullYear(),
                 this.padNumber( oneDay.getMonth() + 1, 2 ),
                 this.padNumber( oneDay.getDate(), 2 )].join("-")].join("/");
    },

    /**
     * utility function to pad zero for a given numbe to given width.
     */
    padNumber: function( number, width, zero ) {

        // default is "0"
        zero = zero || '0';
        // conver the number to string.
        number = number + '';

        return number.length >= width ? number :
            new Array( width - number.length + 1 ).join( zero ) + number;
    }
};

module.exports = ihf;
