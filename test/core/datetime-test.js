/**
 * some basic concept about datetime.
 */

const prettyMs = require('pretty-ms');
// one day in ms, as the
const ONE_DAY = 24 * 60 * 60 * 1000;

console.log("One Day (ms):", ONE_DAY);

// some strings:
let dString = "2019-11-19 15:50:14 063";
let newDate = new Date(dString);
console.log("new Date:", newDate)
//let theDate = Date.parse(dString);
let theDate = new Date(dString.replace(" ", "T").replace(" ", "."));
console.log(dString, "to", theDate);

let dStringOne = "Tue Nov 19 07:23:58 PST 2019";
//let theDateOne = Date.parse(dStringOne);
let theDateOne = new Date(dStringOne);
console.log(dStringOne, "to", theDateOne, "ISO:", theDateOne.toISOString());

console.log("Difference (ms):", (theDate - theDateOne));
console.log("Difference (Day):", Math.ceil((theDate - theDateOne) / ONE_DAY));
let today = new Date();
let yesterday = (new Date()).setDate(today.getDate() - 1);
console.log("Today:", today);
console.log("Yesterday:", (new Date(yesterday)).toISOString());
console.log("Difference to today (ms):", (today - theDateOne));
console.log("Difference to today (Day):", Math.ceil((today - theDateOne) / ONE_DAY));
console.log("Day on Market:", prettyMs(theDate - theDateOne));

let dString3 = "Fri May 06 09:25:41 PDT 2016";
let theDate3 = new Date(dString3);
console.log(dString3, "to", theDate3, "ISO:", theDate3.toISOString());
console.log("ISO Date:", theDate3.toISOString().split("T")[0]);

console.log("Difference (ms):", (theDate - theDate3));
console.log("Day on Market:", prettyMs(theDate - theDate3));

// testing another date time format.
dString = "2/1/2020 11:53";
console.log("For different date time string:", dString);
theDate = new Date(dString);
console.log(theDate);

// test format with timezone
dString = "2019-11-19 15:50:14";
console.table({
    "date string": dString,
    "new Date": (new Date(dString)).toISOString(),
    "new Date tailing UTC": (new Date(dString + " UTC")).toISOString()
});

dString = "2/1/2020 11:53";
console.table({
    "date string": dString,
    "new Date": (new Date(dString)).toISOString(),
    "new Date tailing UTC": (new Date(dString + " UTC")).toISOString()
});

today = new Date();
yesterday = new Date((new Date()).setDate((new Date()).getDate() - 1));
console.log("Yesterday:", yesterday.toISOString().split("T")[0]);

console.table( {
    today: (new Date()).toISOString().split("T")[0],
    yesterday: new Date((new Date()).setDate((new Date()).getDate() - 1)).toISOString().split("T")[0]
});
