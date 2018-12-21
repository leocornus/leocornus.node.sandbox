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

// preparing the numbers array.
let numbers = [];
for(var i = 0; i < 10; i ++) {
    numbers.push(i + 1);
}
console.log(numbers);

// calculate the square for each number.
let newNums = numbers.map((number) => number * number);
console.log(newNums);

