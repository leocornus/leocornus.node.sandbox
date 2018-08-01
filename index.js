// we will set the export default statements here.
const config = require('./src/config');
const spo = require('node-sp-auth');

console.log(JSON.stringify(config, null, 2));

spo.getAuth(config.spoUrl, {username: config.username, 
                            password: config.password})
.then(options => {
    // let's check the options.
    // it only contains a cookie which will have the
    // access token.
    console.dir(options);
});
