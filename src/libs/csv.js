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
    processFolder: function(folder, localConfig) {

        // read all files:
        let csvFiles = fs.readdirSync(folder);
        // quick check.
        console.log(csvFiles);
    }
};

module.exports = csv;
