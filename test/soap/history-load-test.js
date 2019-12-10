/**
 * load history data from CSV file.
 */

const fs = require('fs');

const strategy = require('./../../src/libs/strategy');
const ihf = require('./../../src/libs/ihf');

const config = require('./../../src/config');
const localConfig = config.soap;

let startDate = localConfig.histStartDate;
let histFolders = [];
for(i = 0; i < localConfig.histDays; i ++) {

    histFolders.push( localConfig.histFolderRoot + "/" +
                      ihf.constructFolderPath( startDate ));
    startDate.setDate(startDate.getDate() + 1);
}

// debug to show the folders.
//console.log(histFolders);

let waterfallIterator = function(index, reportOneFolder) {

    let oneFolder = histFolders[index];
    ihf.processOneFolder(oneFolder, reportOneFolder, localConfig);
};

strategy.waterfallOver(0, histFolders.length, waterfallIterator, function() {

    console.log("All Done");
});
