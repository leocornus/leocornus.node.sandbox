/**
 */

const fs = require('fs');
const util = require('util');

const parseCsv = require('csv-parse');

const config = require('./../../src/config');
const localConfig = config.loadCsvFolder;

//let fileName = "/usr/leocorn/COVID-19/csse_covid_19_data/csse_covid_19_daily_reports/01-22-2020.csv";
//let fileName = "/usr/leocorn/COVID-19/csse_covid_19_data/csse_covid_19_daily_reports/03-23-2020.csv";
//let fileName = '/usr/leocorn/COVID-19/csse_covid_19_data/csse_covid_19_daily_reports/03-13-2020.csv';
//
// the file have live data for cases.
let fileName = '/usr/leocorn/COVID-19-web-data/data/cases.csv';

let fileContent = fs.readFileSync(fileName);
//console.log(fileContent);

parseCsv( fileContent, {columns: true},
    function(err, output) {
        //console.dir(output);
        console.table(output);
        console.log(util.inspect(output[0]));

        console.log("hasOwnProperty: ", output[0].hasOwnProperty('Province/State'));
        console.log('hasOwnProperty.call: ',
            Object.prototype.hasOwnProperty.call(output[0], 'Province/State'));
        console.log("in: ", 'Province/State' in output[0]);
        console.log("Province/State: ", output[0]['Province/State']);
        //console.log("Country/Region: ", output[0]["Country/Region"]);
        console.log("values: ", Object.values(output[0]));
        //console.dir(Object.keys(output[0]));
        Object.keys(output[0]).forEach( key => {
            console.log(key, "=", output[0][key]);
            console.log("Province/State ===: ", key === 'Province/State');
            console.log("Province_State ===: ", key === 'Province_State');
        });

        console.log("array includes:", Object.keys(output[0]).includes('Country_Region'));

        //let payload = localConfig.tweakDocs(output, fileName);
        let payload = localConfig.tweakDocs(output);

        console.table(payload);
    }
);
