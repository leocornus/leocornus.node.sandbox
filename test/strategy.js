/**
 * some test cases to use strategy.js
 */

const strategy = require('./../src/strategy');

const now = () => new Date().toUTCString()

var dummyIterator = function(start, reportDone) {

        // just print out timestamp.
    console.log(now() + " - working on " + start);
    setTimeout(function() {
        reportDone(1);
    }, 500);
};

strategy.waterfallOver(10000, dummyIterator, 
    function() {
        console.log(now() + " All Done");
    }
);
