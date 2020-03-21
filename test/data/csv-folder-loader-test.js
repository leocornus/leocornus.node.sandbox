/**
 * load all csv files from the give folder.
 */

const fs = require('fs');

const strategy = require('./../../src/libs/strategy');

const config = require('./../../src/config');
const localConfig = config.loadCsvFolder;

// read all files:
let csvFiles = fs.readdirSync(localConfig.folder);
console.log(csvFiles);
