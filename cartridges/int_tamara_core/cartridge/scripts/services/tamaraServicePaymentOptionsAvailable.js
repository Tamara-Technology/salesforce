var Resource = require("dw/web/Resource");
var URLUtils = require("dw/web/URLUtils");
var Transaction = require("dw/system/Transaction");
var tamaraHelper = require("*/cartridge/scripts/util/tamaraHelper");

/* eslint no-var: off */
var tamaraServicePaymentOptionsAvailable = {
  /**
   * Create Payment Options Available Object Request for Tamara's Checkout process
   * @param {string} orderNumber - The current order's number
   * @return {Object} returns an object or throw an error message
   */
  initPaymentAvailablePaymentObject: function (data) {
    return {
      country: tamaraHelper.getCurrentCountryCode(), // 'US'
      order_value: data["order_value"],
      phone_number: data["phone_number"],
      is_mobile: true,
    };
  },

  /**
   * GET Payment Options Available base on Order
   * @param {dw.order.Order} order - The current order's number
   * @return {Object} returns an object or throw an error message
   */
  initService: function (data) {
    const service = tamaraHelper.getService(
      tamaraHelper.SERVICE.CHECKOUT.PAYMENT_OPTIONS_AVAIABLE
    );
    if (!service) {
      throw new Error(
        "Could not connect to " +
          tamaraHelper.SERVICE.CHECKOUT.PAYMENT_OPTIONS_AVAIABLE
      );
    }

    service.setRequestMethod("POST");
    const requestObject =
      tamaraServicePaymentOptionsAvailable.initPaymentAvailablePaymentObject(
        data
      );
    const callResult = service.call(JSON.stringify(requestObject));

    if (!callResult.isOk()) {
      throw new Error(
        "Call error code " +
          callResult.getError().toString() +
          " | Error => ResponseStatus: " +
          callResult.getStatus() +
          " | ResponseErrorText:  " +
          callResult.getErrorMessage() +
          " | ResponseText: " +
          callResult.getMsg()
      );
    }

    if (!callResult.object) {
      throw new Error(
        "No correct response from " +
          tamaraHelper.SERVICE.CHECKOUT.PAYMENT_OPTIONS_AVAIABLE
      );
    }

    return callResult.object;
  },
};

module.exports = tamaraServicePaymentOptionsAvailable;
