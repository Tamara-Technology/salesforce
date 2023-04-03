var Transaction = require("dw/system/Transaction");
var OrderClass = require("dw/order/Order");

/* eslint no-var: off */
var tamaraServiceAuthorised = {
  /**
   * Authorised the checkout request
   * @param {dw.order.Order} order - The current order's number
   * @return {Object} returns an object or throw an error message
   */
  initService: function (order) {
    var tamaraHelper = require("*/cartridge/scripts/util/tamaraHelper");

    const service = tamaraHelper.getService(
      tamaraHelper.SERVICE.ORDER.AUTHORISED
    );
    if (!service) {
      throw new Error(
        "Could not connect to " + tamaraHelper.SERVICE.ORDER.AUTHORISED
      );
    }
    const url = service.getURL();
    service.setURL(
      url.replace("{orderId}", order.custom.tamaraOrderReferenceID)
    );
    service.setRequestMethod("POST");
    const callResult = service.call();

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

    var resultObject = callResult.object;

    if (!resultObject) {
      throw new Error(
        "No correct response from " + tamaraHelper.SERVICE.ORDER.AUTHORISED
      );
    }

    Transaction.wrap(function () {
      order.custom.tamaraPaymentStatus = "authorised";
      order.setPaymentStatus(OrderClass.PAYMENT_STATUS_PAID);
    });

    return resultObject;
  },
};

module.exports = tamaraServiceAuthorised;
