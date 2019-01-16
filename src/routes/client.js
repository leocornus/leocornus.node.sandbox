"use strict";
const express = require("express");
const config = require("../config");

module.exports = function(app) {

    // vue sendbox.
    app.use('/client/vue', express.static(config.client.vueSandbox));
};
