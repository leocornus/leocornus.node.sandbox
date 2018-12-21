/**
 * Try to figure out how to use promise on Array.map
 *
 * Test case:
 *  - set up an Array of numbers: [1,2,3,4,5,6,...10]
 *  - calculate the square of each number in the Array 
 *    and return the result as an array.
 *  - create a file with name [number].txt and 
 *    content just the number itself
 *  - using Array.map to read from the corresponding file and
 *    calculate the squre
 */

const fs = require('fs');
const now = () => new Date().toUTCString();

async function calSqure(number) {

    let promise = new Promise((resolve, reject) => {
        fs.readFile(number + ".txt", 'utf8',
            (err, data) => {
               console.log(now() + " read number: " + data);
               var num = parseInt(data);
               // resolve will result the result.
               resolve(number * num);
            }
        );
    });

    // await the promise to resolve
    return await promise;
}

// preparing the numbers array.
let numbers = [];
for(var i = 0; i < 10; i ++) {
    numbers.push(i + 1);
}
console.log(numbers);

// get ready file to read.
numbers.forEach(function(number) {

    // by default fs will write to current folder,
    // where we execute the js file.
    fs.writeFile(number + ".txt", number, 'utf8', (err) => {
        // logging...
        console.log(now() + ' write file: ' + number + ".txt");
    });
});

// calculate the square for each number.
// NOTE: we will not get result!
let newNums = numbers.map(calSqure);
console.log(newNums);

// using Promise.all
let promises = numbers.map(calSqure);
Promise.all(promises).then((results) => {

    console.log(results)

    // remove all temp files.
    numbers.forEach(function(number) {

        fs.unlink(number + ".txt",(err) => {
            // logging...
            console.log(now() + ' remove file: ' + number + ".txt");
        });
    });
});
