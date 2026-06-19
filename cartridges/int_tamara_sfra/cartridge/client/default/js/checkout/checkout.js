const shippingHelpers = require("base/checkout/shipping");
const billingHelpers = require("base/checkout/billing");
const summaryHelpers = require("base/checkout/summary");
const billing = require("./billing");

module.exports = {
  updateCheckoutView: function () {
    // Run Tamara update first — only trust order.tamara from AJAX, never page-load globals
    $("body").on("checkout:updateCheckoutView", function (e, data) {
      if (data.order && data.order.tamara) {
        billing.methods.updateTamaraPayment(data.order);
      }
    });

    $("body").on("checkout:updateCheckoutView", function (e, data) {
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
    });
  },

  refreshTamaraOnPaymentStage: function () {
    var checkoutMain = document.getElementById("checkout-main");

    if (!checkoutMain || typeof MutationObserver === "undefined") {
      return;
    }

    var observer = new MutationObserver(function () {
      if (checkoutMain.getAttribute("data-checkout-stage") === "payment") {
        billing.methods.refreshTamaraEligibility();
      }
    });

    observer.observe(checkoutMain, {
      attributes: true,
      attributeFilter: ["data-checkout-stage"],
    });

    if (checkoutMain.getAttribute("data-checkout-stage") === "payment") {
      billing.methods.refreshTamaraEligibility();
    }
  },

  selectPayment: function () {
    $(".payment-options .nav-item .nav-link").on("click", function () {
      if (!$(this).hasClass("collapsed")) return;

      $(".payment-options .tab-pane").removeClass("show").removeClass("active");
      $(".payment-options .nav-item .nav-link").addClass("collapsed");
      $(".payment-options .nav-item .nav-link").attr("data-toggle", "collapse");

      var $link = $(this);
      $link.removeClass("collapsed");
      setTimeout(function () {
        if ($link.hasClass("collapsed")) {
          $link.removeClass("collapsed");
        }
        $link.attr("data-toggle", "none");
      }, 100);

      var targetId = $link.attr("href");
      $(targetId).addClass("active");
    });
  },
};
