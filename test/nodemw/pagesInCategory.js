'use strict';

const Bot = require('nodemw');
const client = new Bot({
    server: 'en.wikipedia.org',
    path: '/w',
    debug: false
});

client.getPagesInCategory( 'Sports_cars', (err, pages) => {

    console.log( 'Pages in category: %d', pages.length );
    //client.logData( pages );
    console.log( pages[0] );
});
