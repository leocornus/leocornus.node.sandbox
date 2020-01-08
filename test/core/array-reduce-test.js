/**
 * quick test the reduce function.
 */

// simple case.
let case1 = {
    numbers: [1, 2, 3, 4, 5, 6, 7]
};
case1['total'] = case1['numbers'].reduce( (total, n) => total + n );

console.table(case1);

// simple case with initial value.
case1['total'] = case1['numbers'].reduce( function(total, n) {
    return total + n;
}, 10); // set initial value to 0

console.table(case1);

// simple case with initial value.
case1['total'] = case1['numbers'].reduce( (total, n) => total + n, 20);

console.table(case1);
