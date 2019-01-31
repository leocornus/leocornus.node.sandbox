/**
 * basic usage for file system module fs.
 *
 */

const fs = require('fs');
const prettyMs = require('pretty-ms');

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
// getTime will return the number in milliseconds since the POSIX Epoch
// which is 1970-01-01
let now = (new Date()).getTime();
console.log(now);
console.log(now - stats.mtimeMs);
console.log(prettyMs(now-stats.mtimeMs));
//fs.utimesSync(fileName, now, now);

// write file again.
//fs.writeFileSync(fileName, 'test again!');
//
//// check the stats again.
//stats = fs.statSync(fileName);
//console.log(stats.mtime);


