/**
 * basic usage for array.
 *
 */

const flat = require('array.prototype.flat');

let source = ["a","b"];
let postfix = ["1","2","3"];

// try the concat funciton.
console.log(source.concat(postfix));

// map it first.
let target = source.map((item) => {
    return postfix.map((post) => {
        return item + "/" + post;
    })
});
console.log(target);

// flat it.
console.log(flat(target));

// try the flatMap
