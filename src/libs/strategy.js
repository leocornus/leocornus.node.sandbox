/**
 * some strategy to manipulate large volume of data.
 */

const logger = require('log4js').getLogger('strategy');

var strategy = {

    /**
     * iterate over from start to end items one after another.
     * The waterfall way or synchronize way.
     * It could be one by one or one group by one group.
     * One group could be any number of items, 10, 100, 1000, etc.
     *
     * For example, group by group sync way will help controll
     * the consumption of some resources such as network connections.
     *
     * start is included and end is not included.
     */
    waterfallOver: function(start, end, iterator, callback) {

        // get started with the done counter with 0.
        var doneCount = start;
        // the iterator will do the actural work
        // It will reportDone when it completed the work.
        iterator(doneCount, reportDone);

        /**
         * This is the function to make sure we iterate all items
         * one after another.
         */
        function reportDone(subTotal) {

            //logger.info(`Done sub total: ${subTotal}`);
            // keep tracking how many items are done work.
            doneCount = doneCount + subTotal;
            logger.info("Processed: " + doneCount);

            if (doneCount >= end) {
                // we have completed the iteration.
                if (callback) {
                    // execute callback function.
                    callback();
                }
            } else {
                // iterate to next one in line.
                iterator(doneCount, reportDone);
            }

            // return the done count for information.
            return doneCount;
        }
    },

    /**
     * this utility will perform like while loop.
     */
    waterfallWhile: function(whileDoneCondition, whileFunction, callback) {

        // let this doneCount to track the progress.
        // it starts from 0,
        let doneCount = 0;

        // the while function will report done.
        whileFunction(doneCount, reportDone);

        /**
         * the report done function will check the while condition
         * to decide complete the while loop or continue.
         */
        function reportDone(subTotal) {

            // keep tracking the progress..
            doneCount = doneCount + subTotal;

            if( whileDoneCondition(doneCount, subTotal) ) {
                // while loop complete.
                if( callback ){
                    callback();
                }
            } else {
                // keep doing the whil function.
                whileFunction(doneCount, reportDone);
            }

            return doneCount;
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
            if (doneCount === items.length) {
                if (callback) {
                    callback();
                }
            }
        }
    },

    /**
     * Asynchronous iterate over a set of items in batch mode.
     * Compare to iterateOver (interate item by item),
     * this strategy will iterrate batch by batch.
     *
     * items is the collections of item we want to iterate over
     * batchSize is to set how many items to process for each iteraion.
     * iterator is a function representing the job when want done on each item
     * callback is the function we want to call when all iterations are over
     *
     */
    iterateOverBatch: function(items, batchSize, iterator, callback) {

        // here we'll keep track of how many reports we've got
        var doneCount = 0;

        // here we give each iteration its job
        // += is the addition assignment, x += y => x = x + Y
        for(var i = 0; i < items.length; i += batchSize) {
            // iterator takes 2 arguments,
            // batch size of items to work on and report function
            // slice takes begine and end index,
            // the begin index is include and end index is NOT included.
            iterator(items.slice(i, i + batchSize), report);
        }

        /**
         * The report function will count actual size.
         */
        function report(actualSize) {
            // this function resembles the phone number in the analogy above
            // given to each call of the iterator so it can report its completion
            doneCount += actualSize;

            // if doneCount equals the number of items in list, then we're done
            if (doneCount === items.length) {
                // just check to make sure callback is exist.
                if (callback) {
                    callback();
                }
            }
        }
    }
}; 

module.exports = strategy;
