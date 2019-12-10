/**
 * read all files from a directory.
 */

const fs = require('fs');

files = fs.readdirSync('/data/backup/ihf/2018/03/2018-03-12');

console.log(files);
