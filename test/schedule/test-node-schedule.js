const schedule = require('node-schedule');

let count = 0;
// execute job every 1 minutes
let j = schedule.scheduleJob('*/1 * * * *', function() {
    console.log("Count = " + count);
    count++;
    if(count >= 3) {
        process.exit(0);
    }
});

console.log('Job started now...');
