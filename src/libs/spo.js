const axios = require('axios');

/**
 * some common utilities for SPO rest API
 */
var spo = {

    // count the folder.
    folderCount: 0,
    // keep all pathes:
    pathes: [],
    // error count.
    errorCount: 0,
    // set teh cap for threads, how many concurrent threads at one time.
    threadCap: 1000,
    // the count start from 1,
    threadCount: 1,

    /**
     * try to interate into a folder.
     */
    processFolder(siteUrl, folderName, headers) {

      var vm = this;
      // count the folder.
      vm.folderCount ++;
      vm.pathes.push(folderName);

      var theUrl = siteUrl +
                   "/_api/web/GetFolderByServerRelativeUrl('" +
                   //encodeURIComponent(folderName) + "')";
                   folderName + "')";
      console.log(`${vm.folderCount}[${vm.threadCount}] : ${folderName},${theUrl}`);
      var reqConfig = {
          headers: headers
      };

      // list files.

      // process sub folders.
      axios.get(theUrl + "/Folders", reqConfig).then(function(response) {
          //console.log(response);

          // got response, we will consider the request finished.
          vm.threadCount --;

          response.data.value.forEach(function(folder, index) {
              //console.log(folder);
              var subFolderName = folder.Name;

              // check if we reach the thread cap.
              if(vm.threadCount >= vm.threadCap) {
                  //var checkCap = function() {
                  //    if(vm.threadCount >= vm.threadCap) {
                  //        setTimeout(function() {
                  //            console.log("waiting...");
                  //            return false;
                  //        }, 50);
                  //    } else {
                  //        return true;
                  //    }
                  //};
                  //while(!checkCap()) {
                  //    // do nothing, keep checking...
                  //}
                  // set timeout for each subfolder.
                  setTimeout(function() {
                      //vm.processFolder(siteUrl, 
                      //                 folderName + "/" + subFolderName,
                      //                 headers);
                      //vm.threadCount ++;
                      console.log("-------------- wait done");
                  }, 100);
              }

              vm.processFolder(siteUrl, 
                               folderName + "/" + subFolderName,
                               headers);
              vm.threadCount ++;
          });
      }).catch(function(error) {
          vm.errorCount ++;
          console.log(`Error-${vm.errorCount}: ${error.message}: ${folderName},${theUrl}`);
      });
    }
};

module.exports = spo;
