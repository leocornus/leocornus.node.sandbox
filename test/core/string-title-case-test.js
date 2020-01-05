/**
 * Title case a sentence in JavaScript.
 *
 * - make the fist letter captalized for each word in a sentence.
 */

/**
 * utility function to title case the given string.
 */
function titleCase(str) {

    // make it lower case first.
    return str.toLowerCase()
    // split the string to an array of strings.
              .split(' ')
              .map(word => {
                  return word.charAt(0).toUpperCase() + word.slice(1);
              })
              .join(' ');
}

let theStrings = [ 
    "i'm a little tea pot",
    "i'm a little tea pot with & sign"
];

theStrings = theStrings.map(one => {
    return {
        before: one,
        after: titleCase(one)
    };
});

console.table(theStrings);
