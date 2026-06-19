"use strict";

var base = module.superModule;

/**
 * Extend order model with Tamara eligibility for checkout AJAX responses
 * @param {dw.order.LineItemCtnr} lineItemContainer - basket/order
 * @param {Object} options - order model options
 */
function OrderModel(lineItemContainer, options) {
  base.call(this, lineItemContainer, options);

  if (!lineItemContainer) {
    return;
  }

  var tamaraHelper = require("*/cartridge/scripts/util/tamaraHelper");

  if (!tamaraHelper.getEnablementStatus()) {
    return;
  }

  try {
    this.tamara = tamaraHelper.getAvailablePayments();
  } catch (e) {
    tamaraHelper
      .getTamaraLogger()
      .error("Tamara OrderModel: {0}", e.message);
    this.tamara = tamaraHelper.getDefaultPaymentTypes();
  }
}

OrderModel.prototype = Object.create(base.prototype);
OrderModel.prototype.constructor = OrderModel;

module.exports = OrderModel;
