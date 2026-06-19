var tamaraHelper = require("*/cartridge/scripts/util/tamaraHelper");

/* eslint no-var: off */
var tamaraServicePaymentOptionsAvailable = {
  /**
   * Create eligibility request payload for Tamara's Pre-Checkout API
   * @param {object} data - order and customer data
   * @return {Object} request payload
   */
  initPaymentAvailablePaymentObject: function (data) {
    return {
      order: {
        amount: data.order.amount,
        currency: data.order.currency,
      },
      customer: {
        phone: tamaraHelper.formatPhoneWithCountryCode(
          data.customer.phone_number
        ),
        email: data.customer.email || "precheck-fallback@example.com",
      },
    };
  },

  /**
   * Check customer eligibility for Tamara payment
   * @param {object} data - order and customer data
   * @return {Object} returns eligibility response or defaults to eligible on timeout
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

    const requestPayload = JSON.stringify(requestObject);

    tamaraHelper.getTamaraLogger().info(
      "Tamara eligibility API request payload: {0}",
      requestPayload
    );

    const callResult = service.call(requestPayload);

    tamaraHelper.getTamaraLogger().info(
      "Tamara eligibility API raw result. Status: {0}, OK: {1}, Error: {2}, Response: {3}",
      callResult.getStatus(),
      callResult.isOk(),
      callResult.getErrorMessage(),
      callResult.getMsg() ||
        (callResult.object ? JSON.stringify(callResult.object) : "")
    );

    if (!callResult.isOk()) {
      if (tamaraHelper.isServiceTimeout(callResult)) {
        tamaraHelper.getTamaraLogger().warn(
          "Tamara eligibility API timed out. Status: {0}, Error: {1}, Response: {2}. Showing Tamara as available.",
          callResult.getStatus(),
          callResult.getErrorMessage(),
          callResult.getMsg()
        );
        return { is_eligible: true };
      }

      tamaraHelper.getTamaraLogger().error(
        "Tamara eligibility API failed. Status: {0}, Error: {1}, Response: {2}",
        callResult.getStatus(),
        callResult.getErrorMessage(),
        callResult.getMsg()
      );

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

    tamaraHelper.getTamaraLogger().info(
      "Tamara eligibility API response: {0}",
      JSON.stringify(callResult.object)
    );

    return callResult.object;
  },
};

module.exports = tamaraServicePaymentOptionsAvailable;
