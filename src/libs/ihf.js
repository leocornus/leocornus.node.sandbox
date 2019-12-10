/**
 * some utility functions for IHF rest APIs
 */

let ihf = {
    
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
