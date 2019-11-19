/**
 */

// some strings:
let dString = "2019-11-19 15:50:14 063";
//let theDate = Date.parse(dString);
let theDate = new Date(dString.replace(" ", "T").replace(" ", "."));
console.log(dString, "to", theDate);

let dStringOne = "Tue Nov 19 07:23:58 PST 2019";
//let theDateOne = Date.parse(dStringOne);
let theDateOne = new Date(dStringOne);
console.log(dStringOne, "to", theDateOne, "ISO:", theDateOne.toISOString());

let dString3 = "Fri May 06 09:25:41 PDT 2016";
let theDate3 = new Date(dString3);
console.log(dString3, "to", theDate3, "ISO:", theDate3.toISOString());
