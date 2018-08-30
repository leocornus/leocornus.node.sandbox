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
 * Solution Two - Asynchronus read 
 * -- Fast enough! But not working!
 *
 * The asynchronous way to read each file. 
 * Here the hehavour will become tricky!
 */
for(var i = 0; i < paths.length; i++) {

    console.log("reading file: " + paths[i]);
    // readFile is asynchronous action.
    fs.readFile(paths[i], 'utf8', function(err, data) {
        var num = parseInt(data);
        totalSum += num;
    });
    console.log("DONE reading file: " + paths[i]);
}

// invoke the callback
// NOTE: the total sum will always be 0!
PrintTotalSum();

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

