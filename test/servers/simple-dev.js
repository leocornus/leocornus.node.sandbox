// the very simple express server.

var express = require('express');
var app = express();

// hello world simple get.
app.get('/', function(req, res) {
    res.send('<h1>Hello Express World - 19880</h1>');
});

// explore the request and response...
// simply echo the request to response.
app.get('/echo', function(req, res) {

    var query = req.query;
    // the request query is an object.
    //console.log(query);
    res.send(query);
});

// start server.
var server = app.listen(19880, function() {
});
