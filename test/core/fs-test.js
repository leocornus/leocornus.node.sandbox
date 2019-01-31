/**
 * basic usage for file system module fs.
 *
 */

const fs = require('fs');

let fileName = '/tmp/notexists';

// check file a path is exist.
let exists = fs.existsSync(fileName);
console.log(exists);

// create the file.
//fs.writeFileSync(fileName, 'test');

exists = fs.existsSync(fileName);
console.log(exists);

// file stats.
let stats = fs.statSync(fileName);
console.log(stats);

// change timestamp of a file.
//let now = new Date();
//fs.utimesSync(fileName, now, now);

// write file again.
fs.writeFileSync(fileName, 'test again!');

// check the stats again.
stats = fs.statSync(fileName);
console.log(stats.mtime);
