const shippingHelpers = require('base/checkout/shipping');
const billingHelpers = require('base/checkout/billing');
const summaryHelpers = require('base/checkout/summary');
const billing = require('./billing');

module.exports = {
    updateCheckoutView: function () {
        $('body').on('checkout:updateCheckoutView', function (e, data) {
            shippingHelpers.methods.updateMultiShipInformation(data.order);
            summaryHelpers.updateTotals(data.order.totals);
            data.order.shipping.forEach(function (shipping) {
                shippingHelpers.methods.updateShippingInformation(
                    shipping,
                    data.order,
                    data.customer,
                    data.options
                );
            });
            billingHelpers.methods.updateBillingInformation(
              data.order,
              data.customer,
              data.options
            );
            billingHelpers.methods.updatePaymentInformation(data.order, data.options);
            summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
            billing.methods.updatePaymentInformation(data.order);
        });
    }
};
