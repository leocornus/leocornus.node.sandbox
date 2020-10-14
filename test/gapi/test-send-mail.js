/**
 * base the quick start sample on page
 * - https://developers.google.com/gmail/api/quickstart/nodejs
 */

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const config = require('./../../src/config');

// get the command line parameters.
const cliParams = process.argv.slice(2);
console.log(cliParams);

// Load client secrets from the config file.
// Authorize a client with credentials, then call the Gmail API.
//authorize(config.googleapis.credentials, listLabels);
authorize(config.googleapis.credentials, sendMessage);

/**
 * quick test to send message.,
 * it works as a callback for the authorizor.
 */
function sendMessage(auth) {

    // the gmail client.
    const gmail = google.gmail( { version: 'v1', auth } );

    const message =
        `From: ${cliParams[0]}\r\n` + 
        `To: ${cliParams[1]}\r\n` +
        "Subject: As basic as it gets\r\n\r\n" +
        "This is the plain text body of the message.  Note the blank line between the header information and the body of the message.";
        
    // The body needs to be base64url encoded.
    const encodedMessage = Buffer.from(message).toString('base64');

    gmail.users.messages.send( {
        userId: 'me',
        resource: {
            raw: encodedMessage
        }
    }, (err, res) => {

        if( err ) {
            return console.log('Error:' + err);
        }

        console.log("Success: " + res);
    });
}

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
	// userId is user's email address. The special value 'me'
	// can be used to indicate the authenticated user
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

function listMessages(auth) {

    const gmail = google.gmail({version: 'v1', auth});

    gmail.users.messages.list(
        {userId: 'me', q: 'is:unread'},
        (err, res) => {

            if(err) {
                console.log(err);
                return;
            }

            //console.dir(res);
            const msgs = res.data.messages;
            msgs.forEach((msg) => {
                //console.dir(msg);
                // get the id.
                gmail.users.messages.get({userId: 'me', id: msg.id},
                    (e, r) => {
                        //console.dir(r.data);
                        console.log(`===================${r.data.id}=====================`);
                        // list of all headers.
                        // headers are defined the RFC 2822
                        r.data.payload.headers.forEach((header) => {
                            //console.log(`${header.name} = ${header.value}`);
                            if(['From', 'Subject', 'Date'].includes(header.name)) {
                                console.log(`${header.name} = ${header.value}`);
                            }
                        });
                        //r.data.payload.parts.forEach((part) => {
                        //    //console.dir(part);
                        //    // Buffer class is for encode and decode, such as base64
                        //    console.log(Buffer.from(part.body.data, 'base64').toString('ascii'));
                        //});

                        // The entire email message in an RFC 2822 formatted
                        // and base64url encoded string
                        // {userId: 'me', id: msg.id, format: 'RAW'}
                        //console.dir(r.data.raw);
                    }
                );
            });
        }
    );
}

/**
 * TODO: find all unread message with attachments.
 * Actions:
 *  - download attachments
 *  - read email message and parse to extract content for fields.
 *  - set the email to read.
 *  - upload attachements to media wiki.
 */
