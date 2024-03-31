constants = {
  PAY_BY_INSTALMENTS: "PAY_BY_INSTALMENTS",
  PAY_NOW: "PAY_NOW",
  TAMARA_PAY: "TAMARA_PAY",
};

/**
 * Update Checkout URL
 * @param {Array} stage Array of stage in Checkout - ["shipping", "payment", "placeOrder", "submitted"];
 */
function updateCheckoutURL(stage) {
  window.location.href = location.pathname + "?stage=" + stage + "#" + stage;
}

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
  // update payment details
  var $paymentSummary = $(".payment-details");
  var htmlToAppend = "";

  if (
    order.billing.payment &&
    order.billing.payment.selectedPaymentInstruments &&
    order.billing.payment.selectedPaymentInstruments.length > 0
  ) {
    if (
      order.billing.payment.selectedPaymentInstruments[0].paymentMethod ===
      "CREDIT_CARD"
    ) {
      htmlToAppend +=
        "<span>" +
        order.resources.cardType +
        " " +
        order.billing.payment.selectedPaymentInstruments[0].type +
        "</span><div>" +
        order.billing.payment.selectedPaymentInstruments[0]
          .maskedCreditCardNumber +
        "</div><div><span>" +
        order.resources.cardEnding +
        " " +
        order.billing.payment.selectedPaymentInstruments[0].expirationMonth +
        "/" +
        order.billing.payment.selectedPaymentInstruments[0].expirationYear +
        "</span></div>";
    } else if (
      [constants.PAY_BY_INSTALMENTS].indexOf(
        order.billing.payment.selectedPaymentInstruments[0].paymentMethod
      ) !== -1
    ) {
      htmlToAppend += "TAMARA PAY INSTALMENTS";
    } else if (
      [constants.PAY_NOW].indexOf(
        order.billing.payment.selectedPaymentInstruments[0].paymentMethod
      ) !== -1
    ) {
      htmlToAppend += "TAMARA PAY NOW";
    } else if (
      [constants.TAMARA_PAY].indexOf(
        order.billing.payment.selectedPaymentInstruments[0].paymentMethod
      ) !== -1
    ) {
      htmlToAppend += "TAMARA PAY";
    }
  }

  $paymentSummary.empty().append(htmlToAppend);
}

function displayTamaraPayment(paymentType) {
  if ($(`li[data-method-id="${paymentType}"]`).length) {
    $(`li[data-method-id="${paymentType}"]`).css("display", "block");
  }
}

function hideTamaraPayment(paymentType) {
  $(`li[data-method-id="${paymentType}"]`).css("display", "none");
}

/**
 * Update Tamara Payment
 * @param {*} order Order
 */
function updateTamaraPayment(order) {
  if (order && order.tamara) {
    if (order.tamara.isEnableTamaraPay) {
      displayTamaraPayment(constants.TAMARA_PAY);
    } else {
      hideTamaraPayment(constants.TAMARA_PAY);
    }

    if (order.tamara.isEnablePaynow) {
      displayTamaraPayment(constants.PAY_NOW);
    } else {
      hideTamaraPayment(constants.PAY_NOW);
    }

    if (order.tamara.isEnableInstalments) {
      displayTamaraPayment(constants.PAY_BY_INSTALMENTS);
    } else {
      hideTamaraPayment(constants.PAY_BY_INSTALMENTS);
    }
  } else {
    [
      constants.TAMARA_PAY,
      constants.PAY_NOW,
      constants.PAY_BY_INSTALMENTS,
    ].forEach(function (paymentType) {
      hideTamaraPayment(paymentType);
    });
  }
}

module.exports = {
  methods: {
    updatePaymentInformation: updatePaymentInformation,
    updateTamaraPayment: updateTamaraPayment,
  },
};
