"use strict";

var server = require("server");

var page = module.superModule;
server.extend(page);

var tamaraCheckoutHelpers = require("*/cartridge/scripts/checkout/tamaraCheckoutHelpers");

/**
 * Inject fresh Tamara eligibility into SubmitShipping JSON responses.
 * Required when the shopper changes shipping phone and resubmits.
 */
server.append("SubmitShipping", function (req, res, next) {
  tamaraCheckoutHelpers.wrapJsonWithTamara(res);
  next();
});

module.exports = server.exports();
