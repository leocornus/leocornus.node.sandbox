/**
 * quick test for string split.
 */
sourceStrings = [
    "a b c",
    "a  b c"
];

console.table(sourceStrings.map(word => {

    return {
        before: word,
        after: word.split(' '),
        afterFilter: word.split(' ').filter(one => one.length > 0)
    }
}));
