'use strict';

var processInclude = require('base/util');

var billing = require('./checkout/billing');

$(document).ready(function () {
    processInclude(require('base/checkout/checkout'));
    processInclude(require('./checkout/billing'));
    processInclude(require('./checkout/checkout'));
    billing.methods.syncTamaraLabelsOnInit();
});
