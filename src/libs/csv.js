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
     * count the total.
     */
    totalRecords: 0,

    /**
     * process the given folder, which will have many csv files.
     *
     */
    processFolder: function(theFolder, localConfig) {

        let self = this;

        let startTime = new Date();
        console.log("Start to process all files for folder:", theFolder);

        // clear total to start.
        self.totalRecords = 0;

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
                console.log("Complete processing all files! Processed", 
                    self.totalRecords, "records in total.");
                console.log("Running time:", prettyMs(totalTime));
            }
        );
    },

    /**
     * process one file in a folder.
     * This function will ALWAYS work with processFolder
     */
    processOneFile: function(theFile, reportOneFileDone, localConfig) {

        let self = this;

        console.log("-- Process file:", theFile);

        // TODO: check file stats to process only updated files.

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
                self.totalRecords += output.length;
                // quick check the data structure.
                //console.table(output);

                // most of files have 300 rows in total, we could process at once!
                // some of the files have thousands of rows in total,
                // we will use the iterate over batch strategy to process them
                // in batch mode.

                // get ready payload.
                let payload = localConfig.tweakDocs(output, theFile);

                // define the batch async post iterator.
                let asyncPost = function(batchItems, reportPostDone) {
                    axios.post(localConfig.solrUpdate, batchItems)
                    .then(function(solrRes) {

                        console.log("  -- Batch post success");
                        reportPostDone(batchItems.length);
                    }).catch(function(solrErr) {

                        console.log("  -- Batch post Failed:", theFile);
                        console.log("  -- Batch post Failed:", solrErr);
                        reportPostDone(batchItems.length);
                    });
                };

                // iterate over the payload.
                strategy.iterateOverBatch(payload, localConfig.solrPostBatchSize,
                    asyncPost, function() {

                        reportOneFileDone(1);
                    }
                );
            }
        );
    },

    /**
     * process a single file.
     */
    processFile: function(filePath, localConfig) {

        let self = this;

        console.log("Process file: ", filePath);

        let content = fs.readFileSync(filePath);
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
                    console.log('  -- Parse CSV Error:', err);
                    return;
                }

                console.log("  -- Total row:", output.length);
                // quick check the data structure.
                //console.table(output);

                // we will use the iterate over batch strategy to process them
                // in batch mode.

                // get ready payload.
                let payload = localConfig.tweakDocs(output);

                self.solrPost(payload, localConfig);
            }
        );
    },

    /**
     * Post the payload to SolrCloud
     */
    solrPost: function(payload, localConfig, reportSolrPostDone) {

        // define the batch async post iterator.
        let asyncPost = function(batchItems, reportPostDone) {

            // query yesterday's number,
            let yQuery = localConfig.buildYesterdayQuery(batchItems);
            //console.log(yQuery);
            axios.post(localConfig.solrSearch, yQuery)
            .then(function(yRes) {

                // merge the number before post them.
                let batchPayload = localConfig.mergeNumbers(batchItems,
                    yRes.data.response.docs);

                //console.table(batchPayload);
                axios.post(localConfig.solrUpdate, batchPayload)
                .then(function(solrRes) {

                    console.log("  -- Batch post success");
                    reportPostDone(batchItems.length);
                }).catch(function(solrErr) {

                    console.log("  -- Batch post Failed:", solrErr);
                    reportPostDone(batchItems.length);
                });
            })
            .catch(function(yErr) {

                console.log("  -- Failed to query yesterday's data!", yErr);
                // just post the docs as it is.
                axios.post(localConfig.solrUpdate, batchItems)
                .then(function(solrRes) {

                    console.log("  -- Batch post success");
                    reportPostDone(batchItems.length);
                }).catch(function(solrErr) {

                    console.log("  -- Batch post Failed:", solrErr);
                    reportPostDone(batchItems.length);
                });
            });
        };

        // iterate over the payload.
        strategy.iterateOverBatch(payload, localConfig.solrPostBatchSize,
            asyncPost, function() {
                console.log("Process complete!");
                if(reportSolrPostDone)
                    reportSolrPostDone(1);
            }
        );
    }
};

module.exports = csv;
