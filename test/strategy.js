/**
 * some test cases to use strategy.js
 */

const strategy = require('./../src/strategy');
const prettyMs = require('pretty-ms');

const now = () => new Date().toUTCString()

/**
 * Half second (500 ms) ticker iterator.
 * incremental counting by 1 for each half second.
 */
var halfSecond = function(start, reportDone) {

    // just print out timestamp.
    console.log(now() + " - working on " + start);

    setTimeout(function() {
        reportDone(1);
    }, 500);
};

// set the start time.
var startTime = new Date();

// count 100 times and each time take half second.
// we should complete in 50 seconds.
strategy.waterfallOver(100, halfSecond,

    function() {
        // the complete callback funtion.
        var totalTime = (new Date()) - startTime;
        console.log(now() + " All Done in " + prettyMs(totalTime));
    }
);
