/**
 * basic usage for array.
 * - every function
 * The every() method tests whether all elements in the array pass the 
 * test implemented by the provided function. It returns a Boolean value
 */

// 2 demontion 
let source = [
    ["a","b","c"],
    [1, 2, 3]
];

// show the source.
console.table(source);

let result = source.every( (row, index) => {
    console.log(index);
    console.log(row);

    // need return to check the next row!
    return Array.isArray(row);
} );

console.log(result);
