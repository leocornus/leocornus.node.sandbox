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

let countSecond = 0;
const job = {
    end: new Date(Date.now() + 10000),
    // execute job every second
    rule: '*/1 * * * * *'
};
let s = schedule.scheduleJob(job, function() {
    console.log("Second: " + countSecond);
    countSecond ++;
});
