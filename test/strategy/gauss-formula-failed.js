/**
 * the WRONG way to implement Gauss formula
 * using the write to and read from file system to demostrate
 * async behavior of JavaScript.
 *
 * TODO NOTICE:
 * we need some async resource to simulate the behavor!
 * such as read from file system or 
 * read from network resources.
 */

const fs = require('fs');

const now = () => new Date().toUTCString()

// get ready numbers.
var numbers = [];
for(var i = 0; i < 100; i ++) {
    numbers.push(i + 1);
}

// get ready file to read.
numbers.forEach(function(number) {

    // by default fs will write to current folder,
    // where we execute the js file.
    fs.writeFile(number + ".txt", number, 'utf8', (err) => {
        // logging...
        console.log(now() + ' write file: ' + number + ".txt");
    });
});

// here is the sum of those numbers.
var theSum = 0;

for(var i = 0; i < numbers.length; i ++) {

    //console.log(now() + " adding number: " + numbers[i]);
    // by default fs will ready from current folder,
    // where we execute the js file.
    fs.readFile(numbers[i] + ".txt", 'utf8',
        (err, data) => {

            console.log(now() + " read number: " + data);
            var num = parseInt(data);
            theSum = theSum + num;
            // remove the file:
            fs.unlink(data + ".txt",
                (err) =>{
                    console.log(now() + " remove file: " +
                                (err ? err : ''));
                }
            );
        }
    );
};

console.log(now() + " Total is: " + theSum);
