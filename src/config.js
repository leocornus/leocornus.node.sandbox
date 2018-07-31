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
    username: 'someone@outlook.com',
    password: 'somepassword'

};

// check if the local.js exist?
if(fs.existsSync('./local.js')) {
    // file not exist. 
    console.log("Could not find local.js! Consider create one!");
} else {
    const local = require('./local');
    config = Object.assign(config, local);
}

module.exports = config;
