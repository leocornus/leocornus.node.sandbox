/**
 * JSforce supports basic "CRUD" operation for records in Salesforce.
 * It also supports multiple record manipulation in one API call.
 *
 * - testing simple update
 */

const jsforce = require('jsforce');

// get the config for jsforce.
// Make sure to get the correct section from the config file.
const config = require('./../../src/config').jsforce;

let conn = new jsforce.Connection({
    //logLevel: "DEBUG",
    loginUrl: config.authorizationUrl
});

conn.login(config.username,
           config.password + config.securityToken,
           function(err, res) {

    if (err) {
        return console.error(err);
    }

    console.log(res);

    let queryObject = config.crudTest.queryObject;
    // get account information.
    conn.query(queryObject, function(err, res) {

        if (err) {
            return console.error(err);
        }

        console.log(res);

        // update some information.
        let objectName = config.crudTest.objectName;
        conn.sobject(objectName).update(config.crudTest.updateValue, 
                                        function(uErr, uRes) {
            console.log(uRes);

            conn.query(queryObject, function(qqErr, qqRes) {

                console.log(qqRes);
            });
        });
    });
});
