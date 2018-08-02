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
      console.log(`${vm.folderCount} : ${folderName},${theUrl}`);
      var reqConfig = {
          headers: headers
      };

      // list files.

      // process sub folders.
      axios.get(theUrl + "/Folders", reqConfig).then(function(response) {
          //console.log(response);
          response.data.value.forEach(function(folder, index) {
              //console.log(folder);
              var subFolderName = folder.Name;
              // set timeout for each subfolder.
              setTimeout(function() {
                  vm.processFolder(siteUrl, folderName + "/" + subFolderName,
                                   headers);
              }, 50 * index);
          });
      }).catch(function(error) {
          vm.errorCount ++;
          console.log(`Error-${vm.errorCount}: ${error.message}: ${folderName},${theUrl}`);
      });
    }
};

module.exports = spo;
