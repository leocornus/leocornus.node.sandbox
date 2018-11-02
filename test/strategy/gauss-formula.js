/**
 * using strategy.iterateOver to implement Gauss formula
 */

const strategy = require('./../../src/strategy');

const now = () => new Date().toUTCString()

// get ready numbers.
var numbers = [];
for(var i = 0; i < 100000; i ++) {
    numbers.push(i +1);
}

// here is the sum of those numbers.
var theSum = 0;

// gauss formula iterator.
var gaussFormula = function(number, report) {

    console.log(now() + " adding number: " + number);
    theSum = theSum + number;
    // report we have done the job.
    report();
};

strategy.iterateOver(numbers, gaussFormula,
    function() {
        // we done, show the result.
        console.log(now() + " Totale is: " + theSum);
    }
);
