const base = module.superModule;

/**
 * Creates an array of objects containing applicable payment methods
 * @param {dw.util.ArrayList<dw.order.dw.order.PaymentMethod>} paymentMethods - An ArrayList of
 *      applicable payment methods that the user could use for the current basket.
 * @returns {Array} of object that contain information about the applicable payment methods for the
 *      current cart
 */
function applicablePaymentMethods(paymentMethods) {
    const collections = require('*/cartridge/scripts/util/collections');

    return collections.map(paymentMethods, function (method) {
        return {
            ID: method.ID,
            name: method.name,
            image: method.image
        };
    });
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    var PaymentMgr = require('dw/order/PaymentMgr');

    base.call(this, currentBasket, currentCustomer, countryCode);
    var paymentAmount = currentBasket.totalGrossPrice;
    var paymentMethods = PaymentMgr.getApplicablePaymentMethods(
        currentCustomer,
        countryCode,
        paymentAmount.value
    );

    this.applicablePaymentMethods =
      paymentMethods ? applicablePaymentMethods(paymentMethods) : null;
}

module.exports = Payment;
