/**
 */

const fs = require('fs');
const parseCsv = require('csv-parse');

const config = require('./../../src/config');
const localConfig = config.loadCsvFolder;

let fileName = "/usr/leocorn/COVID-19/csse_covid_19_data/csse_covid_19_daily_reports/01-22-2020.csv";
//let fileName = '/usr/leocorn/COVID-19/csse_covid_19_data/csse_covid_19_daily_reports/03-13-2020.csv';
let fileContent = fs.readFileSync(fileName);
//console.log(fileContent);

parseCsv( fileContent, {columns: true},
    function(err, output) {
        console.dir(output);
        console.table(output);

        console.log("hasOwnProperty: ", output[0].hasOwnProperty('Province/State'));
        console.log("Province/State: ", output[0]["Provicne/State"]);
        console.log("Country/Region: ", output[0]["Country/Region"]);
        console.dir(Object.keys(output[0]));

        let payload = localConfig.tweakDocs(output, fileName);

        console.table(payload);
    }
);
