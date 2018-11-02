/**
 * some strategy to manipulate large volume of data.
 */
var strategy = {

    /**
     * iterate over the total items one after another.
     * The waterfall way or synchronize way.
     * It could be one by one or one group by one group.
     * One group could be any number of items, 10, 100, 1000, etc.
     *
     * For example, group by group sync way will help controll
     * the consumption of some resources such as network connections.
     */
    waterfallOver: function(total, iterator, callback) {

        // get started with the done counter with 0.
        var doneCount = 0;
        // the iterator will do the actural work
        // It will reportDone when it completed the work.
        iterator(doneCount, reportDone);

        /**
         * This is the function to make sure we iterate all items
         * one after another.
         */
        function reportDone(subTotal) {

            // keep tracking how many items are done work.
            doneCount = doneCount + subTotal;

            if(doneCount === total) {
                // we have completed the iteration.
                callback();
            } else {
                // iterate to next one in line.
                iterator(doneCount, reportDone);
            }
        }
    },

    /**
     * Asynchronous iterate over a set of items.
     *
     * items is the collections of item we want to iterate over
     * iterator is a function representing the job when want done on each item
     * callback is the function we want to call when all iterations are over
     *
     */
    iterateOver: function(items, iterator, callback) {

        // here we'll keep track of how many reports we've got
        var doneCount = 0;

        // here we give each iteration its job
        for(var i = 0; i < items.length; i++) {
            // iterator takes 2 arguments, an item to work on and report function
            iterator(items[i], report)
        }

        function report() {
            // this function resembles the phone number in the analogy above
            // given to each call of the iterator so it can report its completion
            doneCount++;

            // if doneCount equals the number of items in list, then we're done
            if(doneCount === items.length)
                callback();
        }
    }
}; 

module.exports = strategy;
