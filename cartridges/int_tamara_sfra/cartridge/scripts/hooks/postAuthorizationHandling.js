'use strict';
/**
 * This function is to redirect user to the Tamara Hosted Payment
 * without customize the CheckoutService-PlaceOrder controller
 * @param {Object} result - Authorization Result
 * @param {dw.order.Order} order - the order object
 * @param {Object} result - Request & Response object
 */
function postAuthorization(result, order, options) { // eslint-disable-line no-unused-vars
  if (!result.error && order.custom.tamaraCheckoutURL) {
    return {
      error: false,
      continueUrl: order.custom.tamaraCheckoutURL
    };
  }
  return {};
}

exports.postAuthorization = postAuthorization;
