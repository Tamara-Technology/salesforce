var constants = {
  PAY_BY_INSTALMENTS: "PAY_BY_INSTALMENTS",
  PAY_NOW: "PAY_NOW",
  TAMARA_PAY: "TAMARA_PAY",
};

/** Latest tamara state received from a checkout AJAX response */
var lastTamaraFromServer = null;

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

function getTamaraCheckoutConfig() {
  var $config = $("#tamara-checkout-config");
  var paymentMethodField = $config.data("payment-method-field");

  if (!paymentMethodField) {
    paymentMethodField = $('input[type="hidden"][name*="paymentMethod"]')
      .first()
      .attr("name");
  }

  return {
    logoUrl: $config.data("logo") || "",
    paymentMethodField: paymentMethodField || "dwfrm_billing_paymentMethod",
    paymentLabelTitle: $config.data("paymentLabelTitle") || "",
  };
}

/**
 * Create Tamara tab + content in the DOM when the server template did not render them
 * @param {Object} tamara - tamara object from order model
 */
function ensureTamaraPaymentDom(tamara) {
  if ($('li[data-method-id="' + constants.TAMARA_PAY + '"]').length) {
    updateTamaraLabels(tamara);
    return;
  }

  var $paymentOptions = $(".payment-options");

  if (!$paymentOptions.length) {
    return;
  }

  var config = getTamaraCheckoutConfig();
  var labelHtml = getTamaraLabelText(tamara);
  var tabHtml =
    '<li class="nav-item tamara-tab-wrapper" data-method-id="' +
    constants.TAMARA_PAY +
    '">' +
    '<a class="nav-link tamara-tab collapsed" data-toggle="collapse" href="#' +
    constants.TAMARA_PAY +
    '-content" role="tab">' +
    '<div class="payment-input-select-custom mr-1">' +
    '<span class="input-select"></span></div>';

  if (config.logoUrl) {
    tabHtml +=
      '<img class="tamara-option mr-1" src="' +
      config.logoUrl +
      '" height="22" alt="Tamara" title="Tamara">';
  }

  tabHtml +=
    '<span class="payment-desc" style="color:#000;">' +
    labelHtml +
    "</span></a></li>";

  $paymentOptions.append(tabHtml);

  var contentHtml =
    '<div class="container tamara-pay-content-wrapper tamara-pay-content">' +
    '<div class="tab-pane collapse ' +
    constants.TAMARA_PAY +
    '-content" id="' +
    constants.TAMARA_PAY +
    '-content" role="tabpanel">' +
    '<fieldset class="payment-form-fields">' +
    '<input type="hidden" class="form-control" name="' +
    config.paymentMethodField +
    '" value="' +
    constants.TAMARA_PAY +
    '">' +
    "</fieldset></div></div>";

  var $tabContent = $(".credit-card-selection-new .tab-content");

  if ($tabContent.length) {
    $tabContent.append(contentHtml);
  } else {
    $paymentOptions.after(contentHtml);
  }
}

function displayTamaraPayment(paymentType) {
  var $tab = $('li[data-method-id="' + paymentType + '"]');
  var $content = $("#" + paymentType + "-content").closest(".container");

  if ($tab.length) {
    $tab.css("display", "");
    $tab.removeClass("d-none");
  }

  if ($content.length) {
    $content.css("display", "");
    $content.removeClass("d-none");
  }
}

function hideTamaraPayment(paymentType) {
  $('li[data-method-id="' + paymentType + '"]').css("display", "none");
  $("#" + paymentType + "-content")
    .closest(".container")
    .css("display", "none");
}

function getTamaraLabelText(tamara) {
  if (tamara && tamara.paymentLabelTitle) {
    return tamara.paymentLabelTitle;
  }

  if (tamara && tamara[constants.TAMARA_PAY]) {
    var tamaraPayLabel = String(tamara[constants.TAMARA_PAY])
      .replace(/\s+undefined$/, "")
      .trim();

    if (tamaraPayLabel) {
      return tamaraPayLabel;
    }
  }

  var configLabel = getTamaraCheckoutConfig().paymentLabelTitle;

  if (configLabel) {
    return configLabel;
  }

  return "Tamara";
}

function updateTamaraLabels(tamara) {
  var labelText = getTamaraLabelText(tamara);
  var $label = $(
    'li[data-method-id="' + constants.TAMARA_PAY + '"] .payment-desc'
  );

  if ($label.length && labelText) {
    $label.text(labelText);
  }
}

/**
 * Apply Tamara visibility from server eligibility state
 * @param {Object} tamara - tamara object from order model
 */
function applyTamaraState(tamara) {
  if (!tamara) {
    return;
  }

  if (tamara.isEnableTamaraPay && !tamara.paymentLabelTitle) {
    var configLabel = getTamaraCheckoutConfig().paymentLabelTitle;

    if (configLabel) {
      tamara.paymentLabelTitle = configLabel;
    }
  }

  lastTamaraFromServer = tamara;

  if (tamara.isEnableTamaraPay) {
    ensureTamaraPaymentDom(tamara);
    updateTamaraLabels(tamara);
    displayTamaraPayment(constants.TAMARA_PAY);
  } else {
    hideTamaraPayment(constants.TAMARA_PAY);
  }

  hideTamaraPayment(constants.PAY_NOW);
  hideTamaraPayment(constants.PAY_BY_INSTALMENTS);
}

/**
 * Update Tamara payment visibility from checkout order model
 * @param {Object} order - checkout order model
 */
function updateTamaraPayment(order) {
  if (order && order.tamara) {
    applyTamaraState(order.tamara);
  }
}

/**
 * Fetch fresh Tamara eligibility when entering payment
 */
function refreshTamaraEligibility() {
  var url = $("#checkout-main").data("checkout-get-url");

  if (!url) {
    if (lastTamaraFromServer) {
      applyTamaraState(lastTamaraFromServer);
    }
    return;
  }

  $.getJSON(url).done(function (data) {
    if (data.order && data.order.tamara) {
      applyTamaraState(data.order.tamara);
    } else if (lastTamaraFromServer) {
      applyTamaraState(lastTamaraFromServer);
    }
  });
}

function syncTamaraLabelsOnInit() {
  if (lastTamaraFromServer) {
    applyTamaraState(lastTamaraFromServer);
    return;
  }

  var config = getTamaraCheckoutConfig();

  if (config.paymentLabelTitle) {
    updateTamaraLabels({ paymentLabelTitle: config.paymentLabelTitle });
  }
}

module.exports = {
  methods: {
    updatePaymentInformation: updatePaymentInformation,
    updateTamaraPayment: updateTamaraPayment,
    applyTamaraState: applyTamaraState,
    refreshTamaraEligibility: refreshTamaraEligibility,
    ensureTamaraPaymentDom: ensureTamaraPaymentDom,
    syncTamaraLabelsOnInit: syncTamaraLabelsOnInit,
  },
};
