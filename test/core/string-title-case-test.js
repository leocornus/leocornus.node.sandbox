/**
 * Title case a sentence in JavaScript.
 *
 * - make the fist letter captalized for each word in a sentence.
 */

/**
 * utility function to title case the given string.
 */
function titleCase(str, separator) {

    // set the default separator to ' ';
    separator = separator ? separator : ' ';

    // make it lower case first.
    return str.toLowerCase()
    // split the string to an array of strings.
              .split(separator)
              .map(word => {

                  if(word.includes('/')) {
                      word = titleCase(word, '/');
                  }

                  if(word.includes('-')) {
                      word = titleCase(word, '-');
                  }

                  return word.charAt(0).toUpperCase() + word.slice(1);
              })
              .join(separator);
}

let theStrings = [ 
    "i'm a little tea pot",
    "i'm a little tea pot with & sign",
    "the city name Alnwick/Haldimand",
    "another city name Whitchurch-Stouffville",
    "more interesting name Assiginack, Manitoulin Is",
    "name with bracket Adelaide Metcalfe (Twp)"
];

theStrings = theStrings.map(one => {
    return {
        before: one,
        after: titleCase(one)
    };
});

console.table(theStrings);
