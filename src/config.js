/**
 * configuration for the application
 */
const fs = require('fs');

var config = {
    /**
     * here are some default values.
     */

    // URL to SharePoint Online
    spoUrl: "https://sites.sharepoint.com",
    spoSite: "/sites/dev",
    username: 'someone@outlook.com',
    password: 'somepassword',

    samplePathes: [
        "/folderone/two/fileone.pdf"
    ]

};

// check if the local.js exist?
if(fs.existsSync('./local.js')) {
    // file not exist. 
    console.log("Could not find local.js! Consider create one!");
} else {
    const local = require('./local');
    // the first arg is the target Object,
    // all other objects are source objects.
    // The properties in source Object will override
    // the properties in target object.
    config = Object.assign(config, local);
}

module.exports = config;
