'use strict';

const { DateTime } = require( 'luxon' );

let today = DateTime.now();
let zone = '';
showToday( today, zone);

// set time zone, using the identifier defined in this page:
// - https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
zone = 'Asia/Shanghai';
today = DateTime.now().setZone( zone );
showToday( today, zone );

zone = 'America/Toronto';
today = DateTime.now().setZone( zone );
showToday( today, zone );

function showToday( today, zone ) {

    console.table( {
        "Time Zone": zone,
        "ISO String": today.toISO(),
        Year: today.year,
        Month: today.month,
        Day: today.day,
        YYYYMMDD: [today.year, (today.month + '').padStart(2, '0'),
            (today.day + '').padStart(2, '0')].join('')
    } );
}
