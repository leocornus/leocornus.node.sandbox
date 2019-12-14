/**
 * some utility functions for IHF rest APIs
 */

const fs = require('fs');
const parseCsv = require('csv-parse');
const prettyMs = require('pretty-ms');
const axios = require('axios');

const strategy = require('./strategy');

let ihf = {

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
