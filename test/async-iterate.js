var fs = require('fs');

var paths = [
             './test/resources/first-file',  // contains 10
             './test/resources/second-file',  // contains 7
             './test/resources/third-file'  // conatins 5
             ];
var totalSum = 0;


// this the callback we need to call after all iteartion finish
function PrintTotalSum() { 
    console.log(totalSum); 
}

/**
 * =================================================================
 * Solution Three - Correct Asynchronous read
 * 
 */
function IterateOver(list, iterator, callback) {

    // this is the function that will start all the jobs
    // list is the collections of item we want to iterate over
    // iterator is a function representing the job when want done on each item
    // callback is the function we want to call when all iterations are over

    var doneCount = 0;  // here we'll keep track of how many reports we've got

    function report() {
        // this function resembles the phone number in the analogy above
        // given to each call of the iterator so it can report its completion

        doneCount++;

        // if doneCount equals the number of items in list, then we're done
        if(doneCount === list.length)
            callback();
    }

    // here we give each iteration its job
    for(var i = 0; i < list.length; i++) {
        // iterator takes 2 arguments, an item to work on and report function
        iterator(list[i], report)
    }
}

IterateOver(paths, function(path, report) {

    fs.readFile(path, 'utf8', function(err, data) {

        var num = parseInt(data);
        totalSum += num;

        // we must call report to report back iteration completion
        report();
    });
}, PrintTotalSum);

/**
 * =================================================================
 * Solution Two - Asynchronous read 
 * -- Fast enough! But not working!
 *
 * The asynchronous way to read each file. 
 * Here the hehavour will become tricky!
 */
//for(var i = 0; i < paths.length; i++) {
//
//    console.log("reading file: " + paths[i]);
//    // readFile is asynchronous action.
//    fs.readFile(paths[i], 'utf8', function(err, data) {
//        var num = parseInt(data);
//        totalSum += num;
//    });
//    console.log("DONE reading file: " + paths[i]);
//}
//
//// invoke the callback
//// NOTE: the total sum will always be 0!
//PrintTotalSum();

/**
 * =================================================================
 * Solution One - Synchronous read.
 * -- it is working by not efficient!
 *
 * the synchronous way to read file.
 * The for loop will read file one by one!
 */
//for(var i = 0; i < paths.length; i++) {
//    var num = parseInt(fs.readFileSync(paths[i], 'utf8'));
//    totalSum += num;
//}
//
//// invoke the callback
//PrintTotalSum();

