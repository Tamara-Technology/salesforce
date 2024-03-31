"use strict";
var server = require("server");

var page = module.superModule;
server.extend(page);

/**
 * Checkout-Begin : The Checkout-Begin endpoint will render the checkout shipping page for both guest shopper and returning shopper
 */
server.prepend("Begin", function (req, res, next) {
  // eslint-disable-line
  const tamaraHelper = require("*/cartridge/scripts/util/tamaraHelper");
  let viewData = res.getViewData();

  if (tamaraHelper.getEnablementStatus()) {
    try {
      const tamaraAvailablePayment = tamaraHelper.getAvailablePayments();
      viewData.tamara = tamaraAvailablePayment;
    } catch (e) {
      tamaraHelper
        .getTamaraLogger()
        .error(
          "Tamara: " + e.toString() + " in " + e.fileName + ":" + e.lineNumber
        );
    }
  }

  next();
});

module.exports = server.exports();
