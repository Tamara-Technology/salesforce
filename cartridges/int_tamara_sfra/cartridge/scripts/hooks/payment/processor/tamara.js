"use strict";

var Resource = require("dw/web/Resource");
var Transaction = require("dw/system/Transaction");
var tamaraHelper = require("*/cartridge/scripts/util/tamaraHelper");
/**
 * Creates a token. This should be replaced by utilizing a tokenization provider
 * @returns {string} a token
 */
function createToken() {
  return Math.random().toString(36).substr(2);
}

/**
 * Create payment instrument from request
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @param {string} paymentMethodID - paymentmethodID
 * @param {Object} req the request object
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation, paymentMethodID, req) {
  var collections = require("*/cartridge/scripts/util/collections");
  var serverErrors = [];

  if (
    [
      tamaraHelper.METHOD_TAMARA_PAY,
      tamaraHelper.METHOD_TAMARA_PAYNOW,
      tamaraHelper.METHOD_TAMARA_INSTALMENTS,
      tamaraHelper.METHOD_TAMARA_6_INSTALMENTS,
    ].indexOf(paymentMethodID) === -1
  ) {
    tamaraHelper
      .getTamaraLogger()
      .error(
        'Tamara: payment method requested "{0}" is incorrect in int_tamara_sfra/cartridge/script/hooks/payment/processor/tamara.js:Handle().',
        paymentMethodID
      );
    serverErrors.push(
      Resource.msg("error.paymenttypes.outoflist", "tamara", null)
    );
    return { serverErrors: serverErrors, error: true };
  }

  Transaction.wrap(function () {
    collections.forEach(basket.getPaymentInstruments(), function (item) {
      basket.removePaymentInstrument(item);
    });

    basket.createPaymentInstrument(paymentMethodID, basket.totalGrossPrice);
  });

  return { serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
  const OrderMgr = require("dw/order/OrderMgr");
  const tamaraServiceCheckout = require("*/cartridge/scripts/services/tamaraServiceCheckout");
  var serverErrors = [];
  var fieldErrors = {};
  var error = false;
  const order = OrderMgr.getOrder(orderNumber.toString());
  if (!order) {
    serverErrors.push(Resource.msg("error.technical", "checkout", null));
    tamaraHelper
      .getTamaraLogger()
      .error(
        "Tamara: can not get the order from orderNumber {0} int_tamara_sfra/cartridge/script/hooks/payment/processor/tamara.js:Authorize()"
      );
    return {
      fieldErrors: fieldErrors,
      serverErrors: serverErrors,
      error: error,
    };
  }

  try {
    tamaraServiceCheckout.initService(
      order,
      paymentInstrument,
      paymentProcessor
    );
    Transaction.wrap(function () {
      order.trackOrderChange(
        "CheckoutServices-PlaceOrder: " +
          Resource.msg("note.content.tamara.createsession", "tamara", null)
      );
    });
  } catch (e) {
    error = true;
    serverErrors.push(Resource.msg("error.technical", "checkout", null));
    tamaraHelper
      .getTamaraLogger()
      .error(
        "Tamara: " + e.toString() + " in " + e.fileName + ":" + e.lineNumber
      );
  }

  return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.createToken = createToken;
