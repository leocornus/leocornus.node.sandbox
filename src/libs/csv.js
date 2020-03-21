/**
 * utility functions to handle CSV files.
 *
 * using csf-parse to parse CSV files.
 */

const fs = require('fs');

const parseXml = require('xml2js').parseString;
const parseCsv = require('csv-parse');
const prettyMs = require('pretty-ms');
const axios = require('axios');

const strategy = require('./strategy');

let csv = {

    /**
     * process the given folder.
     */
    processFolder: function(theFolder, localConfig) {

        let self = this;

        let startTime = new Date();
        console.log("Start to process all files for folder:", theFolder);

        // read all files:
        let files = fs.readdirSync(theFolder);
        // quick check.
        //console.log(files);
        // filter to only .csv files.

        // set the waterfall iterator to process each file one after another.
        // the function signature is defined in stragegy lib.
        let waterfallIterator = function(index, reportOneFile) {

            let oneFile = files[index];
            if( oneFile.endsWith(".csv") ) {
                self.processOneFile(theFolder + "/" + oneFile, reportOneFile,
                                    localConfig);
            } else {
                console.log("-- Skip file:", oneFile);
                reportOneFile(1);
            }
        };

        // waterfall iterate through all files.
        strategy.waterfallOver(0, files.length, waterfallIterator,
            /**
             * the callback function when the iteration is complete!
             */
            function() {

                let totalTime = (new Date()) - startTime;
                console.log("Complete processing all files!");
                console.log("Running time:", prettyMs(totalTime));
            }
        );
    },

    processOneFile: function(theFile, reportOneFileDone, localConfig) {

        console.log("-- Process file:", theFile);

        let content = fs.readFileSync(theFile);
        // parse csv content
        parseCsv( content,
            // turn on the columns,
            // so the JSON output will be in Object format
            // with column name.
            {columns: true},
            /**
             * callback function after parse.
             */
            function(err, output) {

                if(err) {
                    console.log('  -- Parse CSV Error:', theFile, err);
                    reportOneFileDone(1);
                }

                console.log("  -- Total row:", output.length);
                // quick check the data structure.
                console.table(output);
                reportOneFileDone(1);
            }
        );
    }
};

module.exports = csv;
