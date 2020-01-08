/**
 * quick test the reduce function.
 */

// simple case.
let case1 = {
    numbers: [1, 2, 3, 4, 5, 6, 7]
};
case1['total'] = case1['numbers'].reduce( (total, n) => total + n );

console.table(case1);
