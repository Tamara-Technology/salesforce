const base = module.superModule;

const collections = require("*/cartridge/scripts/util/collections");
const tamaraHelper = require("*/cartridge/scripts/util/tamaraHelper");

/**
 * Creates an array of objects containing applicable payment methods
 * @param {dw.util.ArrayList<dw.order.dw.order.PaymentMethod>} paymentMethods - An ArrayList of
 *      applicable payment methods that the user could use for the current basket.
 * @returns {Array} of object that contain information about the applicable payment methods for the
 *      current cart
 */
function applicablePaymentMethods(paymentMethods) {
  return collections.map(paymentMethods, function (method) {
    return {
      ID: method.ID,
      name: method.name,
      image: method.image,
    };
  });
}

/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments) {
  return collections.map(
    selectedPaymentInstruments,
    function (paymentInstrument) {
      var results = {
        paymentMethod: paymentInstrument.paymentMethod,
        amount: paymentInstrument.paymentTransaction.amount.value,
      };
      if (paymentInstrument.paymentMethod === "CREDIT_CARD") {
        results.lastFour = paymentInstrument.creditCardNumberLastDigits;
        results.owner = paymentInstrument.creditCardHolder;
        results.expirationYear = paymentInstrument.creditCardExpirationYear;
        results.type = paymentInstrument.creditCardType;
        results.maskedCreditCardNumber =
          paymentInstrument.maskedCreditCardNumber;
        results.expirationMonth = paymentInstrument.creditCardExpirationMonth;
      } else if (paymentInstrument.paymentMethod === "GIFT_CERTIFICATE") {
        results.giftCertificateCode = paymentInstrument.giftCertificateCode;
        results.maskedGiftCertificateCode =
          paymentInstrument.maskedGiftCertificateCode;
      } else if (
        paymentInstrument.paymentMethod ===
        tamaraHelper.METHOD_PAY_BY_INSTALMENTS
      ) {
        results.instalment =
          paymentInstrument.paymentTransaction.custom.tamaraInstalmentNumber;
      }

      return results;
    }
  );
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
  var PaymentMgr = require("dw/order/PaymentMgr");

  base.call(this, currentBasket, currentCustomer, countryCode);
  var paymentAmount = currentBasket.totalGrossPrice;
  var paymentMethods = PaymentMgr.getApplicablePaymentMethods(
    currentCustomer,
    countryCode,
    paymentAmount.value
  );

  var paymentInstruments = currentBasket.paymentInstruments;

  this.applicablePaymentMethods = paymentMethods
    ? applicablePaymentMethods(paymentMethods)
    : null;

  this.selectedPaymentInstruments = paymentInstruments
    ? getSelectedPaymentInstruments(paymentInstruments)
    : null;
}

module.exports = Payment;
