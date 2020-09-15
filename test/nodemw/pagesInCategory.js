'use strict';

const Bot = require('nodemw');
const client = new Bot({
    server: 'en.wikipedia.org',
    protocol: 'https',
    path: '/w',
    debug: true 
});

client.getPagesInCategory( 'Demo_on_Monday', (err, pages) => {

    if(err) {
        console.log(err);
        return;
    }

    console.log( 'Pages in category: %d', pages.length );
    //client.logData( pages );
    console.log( pages[0] );
});
