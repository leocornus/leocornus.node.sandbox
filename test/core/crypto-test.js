const crypto = require('crypto');

// create a MD5 hash
let md5 = crypto.createHash('md5');
let hello = md5.update('hello md5').digest('hex');
console.log(hello);

// need create new HASH after call digest.
md5 = crypto.createHash('md5');
let again = md5.update('hello md5').digest('hex');
console.log(again);
