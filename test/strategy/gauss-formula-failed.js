/**
 * the WRONG way to implement Gauss formula
 *
 * TODO NOTICE:
 * NOT READY YET!
 * we need some async resource to simulate the behavor!
 * such as read from file system or 
 * read from network resources.
 */

const now = () => new Date().toUTCString()

// get ready numbers.
var numbers = [];
for(var i = 0; i < 20; i ++) {
    numbers.push(i + 1);
}

// here is the sum of those numbers.
var theSum = 0;

for(var i = 0; i < numbers.length; i ++) {

    //console.log(now() + " adding number: " + numbers[i]);
    theSum = theSum + numbers[i];
};

console.log(now() + " Total is: " + theSum);

theSum = 0;

numbers.forEach(function(number) {

    console.log(now() + " adding number: " + number);
    theSum = theSum + number;
});

console.log(now() + " WRONG total is: " + theSum);
