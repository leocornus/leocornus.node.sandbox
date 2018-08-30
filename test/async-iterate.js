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

/*
 * =================================================================
 * Solution One - Synchronous read.
 *
 * the synchronous way to read file.
 * The for loop will read file one by one!
 */
for(var i = 0; i < paths.length; i++) {
    var num = parseInt(fs.readFileSync(paths[i], 'utf8'));
    totalSum += num;
}

// invoke the callback
PrintTotalSum();
