/**
 * basic usage for array.
 * - every function
 *
 */

let source = [
    ["a","b","c"],
    [1, 2, 3]
];

// show the source.
console.table(source);

source.every( (row, index) => {
    console.log(index);
    console.log(row);
} );
