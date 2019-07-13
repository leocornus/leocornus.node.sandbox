
const xml2js = require('xml2js');
const fs = require('fs');

// load configuration
const config = require('./../../src/config');
const localConfig = config.xml2Solr;

var parser = new xml2js.Parser();
var fileName = localConfig.xmlFileFolder + '/products_0001_2570_to_430420.xml';
fs.readFile(fileName, function(err, data) {
    parser.parseString(data, function(err, result) {

        console.log('Found ' + result.products.product.length + ' products');
        let docs = result.products.product.map( item => {

            return localConfig.prepareSolrDoc(item);
        });

        console.log(docs.length);
        console.dir(docs[0]);
        //console.dir(result.products.product[0]);
        //console.dir(result.products.product[0].details[0].detail[0]);

        // post to Solr collection
    });
});
