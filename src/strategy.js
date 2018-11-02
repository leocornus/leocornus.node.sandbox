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
    }
}; 

module.exports = strategy;
