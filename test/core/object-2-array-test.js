/**
 * test to conver Object to array.
 */

let source = {
    max: 2345.66,
    min: 123
};

console.table(source);

function object2Array(obj) {

    let arr = Object.keys(obj).map(key => {
        return [key, obj[key]];
        //return {name: key, value: obj[key]};
    });

    return arr;
}

console.table(object2Array(source));
console.dir(object2Array(source));
