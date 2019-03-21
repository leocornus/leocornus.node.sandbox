/**
 * configuration for the application
 */
var config = {
    /**
     * here are some default values.
     */
    username: 'someone@outlook.com',
    password: 'somepassword',

    samplePathes: [
        "/folderone/two/fileone.pdf"
    ]

};

try {
    const local = require('./local');
    // the first arg is the target Object,
    // all other objects are source objects.
    // The properties in source Object will override
    // the properties in target object.
    config = Object.assign(config, local);
} catch (e) {
    // file not exist.
    console.log("Could not find src/local.js! Consider create one!");
}

module.exports = config;
