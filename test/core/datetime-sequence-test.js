/**
 * try to generate date time sequence as folder name
 * with the following pattern:
 * YEAR/MONTH/YEAR-MONTH-DAY
 * for example:
 * 2019/01/2018-01-04
 */

let startDate = new Date("2018-03-12T12:00:00.000");

for(i = 0; i < 40; i ++) {

    console.log(i, "-",  getFolderPath(startDate));
    startDate.setDate(startDate.getDate() + 1);
}

function getFolderPath(oneDay) {

    return oneDay.getFullYear() + "/" +
        pad(oneDay.getMonth() + 1, 2) + "/" +
        [oneDay.getFullYear(), pad(oneDay.getMonth() + 1, 2),
         pad(oneDay.getDate(), 2)].join("-");
}

function pad(n, width, z) {

    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
