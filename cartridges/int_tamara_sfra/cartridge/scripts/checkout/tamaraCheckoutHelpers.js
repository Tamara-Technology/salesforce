"use strict";

/**
 * Wrap res.json to attach fresh Tamara eligibility to checkout order responses.
 * @param {Object} res - route response object
 */
function wrapJsonWithTamara(res) {
  var tamaraHelper = require("*/cartridge/scripts/util/tamaraHelper");
  var originalJson = res.json;

  res.json = function (payload) {
    if (
      tamaraHelper.getEnablementStatus() &&
      payload &&
      payload.order &&
      typeof payload.order === "object"
    ) {
      payload.order.tamara = tamaraHelper.getAvailablePayments();
    }

    return originalJson.call(this, payload);
  };
}

module.exports = {
  wrapJsonWithTamara: wrapJsonWithTamara,
};
