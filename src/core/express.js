"use strict";

let config = require("../config");
let express = require("express");
let cors = require("cors");
let bodyParser = require("body-parser");

module.exports = function() {

    // Create express app
    let app = express();
    // set up CORS:
    app.use(cors({
      origin: function(origin, callback){

          // allow requests with no origin
          // (like mobile apps or curl requests)
          if(!origin) return callback(null, true);

          if(config.server.allowedOrigins.indexOf(origin) === -1){
              var msg = 'The CORS policy for this site does not ' +
                        'allow access from the specified Origin.';
              return callback(new Error(msg), false);
          }

          return callback(null, true);
      }
    }));

    // use body-parser as the middle-ware.
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    // Load routes
    require("../routes")(app);

    return app;
};
