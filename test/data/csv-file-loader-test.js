/**
 * load a single file.
 */

const csv = require('./../../src/libs/csv');

const config = require('./../../src/config');
const localConfig = config.loadCsvFolder;

csv.processFile( localConfig.filePath, localConfig );
