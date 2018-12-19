/**
 * base the quick start sample on page
 * - https://developers.google.com/gmail/api/quickstart/nodejs
 */

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const config = require('./../../src/config');

// Load client secrets from the config file.
// Authorize a client with credentials, then call the Gmail API.
authorize(config.googleapis.credentials, listLabels);

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {

    const {client_secret, client_id, redirect_uris} = credentials.installed;
    // create the OAuth 2 client.
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // we should have token ready.
    // set the token.
    oAuth2Client.setCredentials(config.googleapis.token);

    callback(oAuth2Client);
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {

    const gmail = google.gmail({version: 'v1', auth});

    // list labels
    gmail.users.labels.list({
        // TODO: Why me?
        userId: 'me',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);

        const labels = res.data.labels;
        if (labels.length) {
          console.log('Labels:');
          labels.forEach((label) => {
            console.log(`- ${label.name}`);
          });
        } else {
          console.log('No labels found.');
        }
    });
}
