const axios = require('axios');

/**
 * some common utilities for SPO rest API
 */
var spo = {

    // count the folder.
    folderCount: 0,

    // keep all pathes:
    pathes: [],

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
      console.log(`${folderName},${theUrl}`);
      var reqConfig = {
          headers: headers
      };

      // list files.

      // process sub folders.
      axios.get(theUrl + "/Folders", reqConfig).then(function(response) {
          //console.log(response);
          response.data.value.forEach(function(folder) {
              //console.log(folder);
              var subFolderName = folder.Name;
              vm.processFolder(siteUrl, folderName + "/" + subFolderName, 
                               headers);
          });
      }).catch(function(error) {
          console.log(error);
      });
    }
};

module.exports = spo;
