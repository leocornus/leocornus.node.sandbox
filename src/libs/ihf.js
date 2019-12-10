/**
 * some utility functions for IHF rest APIs
 */

const fs = require('fs');
const strategy = require('./strategy');

let ihf = {

    /**
     * process all csv files in one folder.
     */
    processOneFolder: function(theFolder, reportOneFolderDone) {

        let self = this;

        console.log(theFolder);
        // get all files in the filder.
        let files = fs.readdirSync(theFolder);
        // set the waterfall iterator to process each file one after another.
        let waterfallIterator = function(index, reportOneFile) {

            let oneFile = files[index];
            self.processOneFile(theFolder + "/" + oneFile, reportOneFile);
        }
        // waterfall iterate through all files.
        strategy.waterfallOver(0, files.length, waterfallIterator, function() {

            console.log("Process all files for folder:", theFolder);
            reportOneFolderDone(1);
        });
    },

    /**
     * process one csv file a time.
     */
    processOneFile: function(theFile, reportOneFileDone) {

        let self = this;

        console.log("--", theFile);
        // read the file content
        // adding header.
        // parse csv content
        // async post to solr.
        reportOneFileDone(1);
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
