const shippingHelpers = require("base/checkout/shipping");
const billingHelpers = require("base/checkout/billing");
const summaryHelpers = require("base/checkout/summary");
const billing = require("./billing");

module.exports = {
  updateCheckoutView: function () {
    $("body").on("checkout:updateCheckoutView", function (e, data) {
      console.log(`checkout:updateCheckoutView: int_tamara_sfra: `, data);

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
      summaryHelpers.updateOrderProductSummaryInformation(
        data.order,
        data.options
      );
      billing.methods.updatePaymentInformation(data.order);
      billing.methods.updateTamaraPayment(data.order);
    });
  },

  selectPayment: function () {
    $(".payment-options .nav-item .nav-link").on("click", function () {
      if (!$(this).hasClass("collapsed")) return;

      // remove all active class
      $(`.payment-options .tab-pane`).removeClass("show").removeClass("active");
      $(".payment-options .nav-item .nav-link").addClass("collapsed");
      $(".payment-options .nav-item .nav-link").attr("data-toggle", "collapse");

      $(this).removeClass("collapsed");
      setTimeout(() => {
        if ($(this).hasClass("collapsed")) {
          $(this).removeClass("collapsed");
        }
        $(this).attr("data-toggle", "none");
      }, 100);

      const targetId = $(this).attr("href");
      $(targetId).addClass("active");
    });
  },
};
