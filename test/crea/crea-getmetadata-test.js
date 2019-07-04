/**
 * simple test case to use Crea moduel.
 */

const Crea = require('./../../src/libs/crea');
const log4js = require('log4js');

const config = require('./../../src/config');
// configure log4js
log4js.configure(config.crea.log4jsConfig);

let crea = new Crea( config.crea.username, config.crea.password );

console.log(crea.apiUrls);
let params = {
        Type: 'METADATA-CLASS',
        Format: 'Standard-XML',
        //Format: 'COMPACT',
        //ID: '*',
        ID: '0',
    };

async function testGetMetadata() {

    // wait the authorization to complete.
    let metadata = await crea.getMetadata(params);

    //console.log(cookie);
    console.log(metadata.data);
}

testGetMetadata();
