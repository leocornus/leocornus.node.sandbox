// we will set the export default statements here.
var hello = require('./src/hello');
var config = require('./src/config');

hello.say("Hello require!");
hello.say("Config: " + JSON.stringify(config, null, 2));
