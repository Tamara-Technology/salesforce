"use strict";

var server = require("server");

var page = module.superModule;
server.extend(page);

var tamaraCheckoutHelpers = require("*/cartridge/scripts/checkout/tamaraCheckoutHelpers");

/**
 * Inject fresh Tamara eligibility into checkout JSON responses.
 */
server.append("Get", function (req, res, next) {
  tamaraCheckoutHelpers.wrapJsonWithTamara(res);
  next();
});

server.append("SubmitPayment", function (req, res, next) {
  tamaraCheckoutHelpers.wrapJsonWithTamara(res);
  next();
});

module.exports = server.exports();
