/**
 * load all csv files from the give folder.
 */

const csv = require('./../../src/libs/csv');

const config = require('./../../src/config');
const localConfig = config.loadCsvFolder;

csv.processFolder(localConfig.folder, localConfig);
