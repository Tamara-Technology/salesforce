/**
 *The helper for Tamara Payment
 */
const dwsystem = require("dw/system");
const dwutil = require("dw/util");
const Resource = require("dw/web/Resource");
const tamaraServiceOrderDetail = require("*/cartridge/scripts/services/tamaraServiceOrderDetail");
var collections = require("*/cartridge/scripts/util/collections");

const preferenceCurrentSite = dwsystem.Site.getCurrent();

/* eslint no-var: off */
var tamaraHelperObj = {
  PROCESSOR_TAMARA: "TAMARA",

  METHOD_TAMARA_PAY: "TAMARA_PAY",

  METHOD_TAMARA_PAYNOW: "PAY_NOW",

  METHOD_TAMARA_PAYLATER: "TAMARA_PAYLATER",

  METHOD_PAY_BY_INSTALMENTS: "PAY_BY_INSTALMENTS",

  PAY_NOW: "PAY_NOW",

  PAY_LATER: "PAY_NEXT_MONTH",

  PAY_BY_INSTALMENTS: "PAY_BY_INSTALMENTS",

  METHOD_CREDIT_CARD: "CREDIT_CARD",

  TAMARA_CACHE_API_OBJECT: "TamaraCachePaymentOptionsPreCheckAPI",

  PAYMENT_LABELS: {
    SA: {
      en: {
        title: "Tamara - Monthly Payments. Sharia Compliant.",
      },
      ar: {
        title: "تمارا - دفعات شهرية. متوافقة مع الشريعة",
      },
    },
    AE: {
      en: {
        title: "Tamara - Monthly Payments.",
      },
      ar: {
        title: "تمارا - دفعات شهرية",
      },
    },
  },

  SERVICE: {
    CHECKOUT: {
      SESSION: "tamara.checkout.session",
      PAYMENTTYPES: "tamara.checkout.paymenttypes",
      PAYMENT_OPTIONS_AVAIABLE: "tamara.checkout.paymentoptionsavailability",
    },
    ORDER: {
      AUTHORISED: "tamara.order.authorised",
      DETAILED: "tamara.order.detail",
      CANCEL: "tamara.order.cancel",
    },
    WEBHOOK: {
      REGISTER: "tamara.webhook.register",
    },
    PAYMENT: {
      CAPTURE: "tamara.payment.capture",
      REFUND: "tamara.payment.refund",
    },
  },
  ENCRYPT: {
    MODE: "AES/CBC/PKCS5Padding",
    KEY: "RmVJTjlTY0hEd1Mxa0FWOA==",
    IV: "ZzFONFlQaXBLYmhuSzhVVw==",
  },

  /**
   * Generate a token from a string
   * @param {string} message a string of message you want to encrypt token
   * @returns {string} encrypt message
   */
  generateToken: function (message) {
    const Cipher = require("dw/crypto/Cipher");
    var crypto = new Cipher();
    return crypto.encrypt(
      message,
      this.ENCRYPT.KEY,
      this.ENCRYPT.MODE,
      this.ENCRYPT.IV,
      0
    );
  },

  /**
   * Decrypt a token
   * @param {string} message a string of message you want to decrypt
   * @returns {string} decrypt message
   */
  decryptToken: function (message) {
    const Cipher = require("dw/crypto/Cipher");
    var crypto = new Cipher();
    return crypto.decrypt(
      message,
      this.ENCRYPT.KEY,
      this.ENCRYPT.MODE,
      this.ENCRYPT.IV,
      0
    );
  },

  /**
   * Get Current country code from the request
   * @returns {string} a Country Code
   */
  getCurrentCountryCode: function () {
    return dwutil.Locale.getLocale(request.getLocale()).getCountry();
  },

  /**
   * Get Current lang code from the request
   * @returns {string} a Country Code
   */
  getCurrentLangCode: function () {
    return dwutil.Locale.getLocale(request.getLocale()).getLanguage();
  },

  /**
   * Dial codes for supported Tamara countries
   */
  COUNTRY_DIAL_CODES: {
    SA: "966",
    AE: "971",
  },

  /**
   * Ensure phone number includes country dial code for Tamara API
   * @param {string} phone - raw phone number from checkout
   * @returns {string|null} phone with country code prefix
   */
  formatPhoneWithCountryCode: function (phone) {
    if (!phone) {
      return phone;
    }

    var digits = phone.replace(/\D/g, "");

    if (!digits) {
      return phone;
    }

    if (digits.indexOf("00") === 0) {
      digits = digits.substring(2);
    }

    var countryCode;
    var knownDialCode;
    for (countryCode in this.COUNTRY_DIAL_CODES) {
      knownDialCode = this.COUNTRY_DIAL_CODES[countryCode];
      if (digits.indexOf(knownDialCode) === 0) {
        return digits;
      }
    }

    var dialCode = this.COUNTRY_DIAL_CODES[this.getCurrentCountryCode()];

    if (!dialCode) {
      return digits;
    }

    if (digits.charAt(0) === "0") {
      digits = digits.substring(1);
    }

    return dialCode + digits;
  },

  /**
   * Get logger for Tamara Payment
   * @returns {dw.system.Log} a Log object with a "tamara" prefix name
   */
  getTamaraLogger: function () {
    return dwsystem.Logger.getLogger("Tamara", "tamara");
  },

  /**
   * Get logger for Tamara Payment
   * @returns {dw.system.Log} a Log object with a "tamara" prefix name
   */
  getTamaraBMLogger: function () {
    return dwsystem.Logger.getLogger("TamaraBM", "tamara");
  },

  /**
   * Get Tamara's custom preference attribute base on ID
   * @param {string} field custom attribute's id
   * @returns {any} a custom attributes for tamara payment preference
   */
  getCustomPreference: function (field) {
    let customPreference = null;
    if (
      preferenceCurrentSite &&
      preferenceCurrentSite.getCustomPreferenceValue(field)
    ) {
      customPreference = preferenceCurrentSite.getCustomPreferenceValue(field);
    }
    return customPreference;
  },

  /**
   * Get Tamara's enablement status
   * @returns {any} a custom attributes value
   */
  getEnablementStatus: function () {
    return (
      this.getCustomPreference("tamaraEnablement") &&
      new dwutil.ArrayList(
        this.getCustomPreference("tamaraSupportedCountries")
      ).indexOf(this.getCurrentCountryCode()) !== -1
    );
  },

  /**
   * Get Tamara's Support Country
   * @returns {any} a custom attributes value
   */
  getSupportedCountriesAsString: function () {
    return new dwutil.ArrayList(
      this.getCustomPreference("tamaraSupportedCountries")
    ).join(";");
  },

  /**
   * Get Tamara's API Endpoint value
   * @returns {any} a custom attributes value
   */
  getAPIEndPoint: function () {
    return this.getCustomPreference("tamaraEndPoint");
  },

  /**
   * Get Widget JS URL
   * @returns Widget JS URL
   */
  getWidgetJSURL: function () {
    return this.getCustomPreference("tamaraWidgetJSURL");
  },

  /**
   * Get tamara widget public key
   * @returns {any} a custom attributes value
   */
  getTamaraWidgetPublicKey: function () {
    return preferenceCurrentSite.getCustomPreferenceValue(
      "tamaraWidgetPublicKey"
    );
  },

  /**
   * show pdp payment widget or not
   * @returns {any} a custom attributes value
   */
  showPDPWidget: function () {
    return preferenceCurrentSite.getCustomPreferenceValue(
      "tamaraPDPWidgetEnablement"
    );
  },
  /**
   * show cart payment widget or not
   * @returns {any} a custom attributes value
   */
  showCartWidget: function () {
    return preferenceCurrentSite.getCustomPreferenceValue(
      "tamaraCartWidgetEnablement"
    );
  },

  /**
   * Get Tamara's APIToken value
   * @returns {any} a custom attributes value
   */
  getAPIToken: function () {
    return this.getCustomPreference("tamaraAPIToken");
  },

  /**
   * Get Webhoook events supported
   * @returns {any} a custom attributes value
   */
  getWebhookEvents: function () {
    return this.getCustomPreference("tamaraWebhookEvents");
  },

  /**
   * get Total Discount based on the price adjustments
   * @param {object} price Adjustments
   * @returns {object} discount amount and discount name
   */
  getTotalDiscount: function (priceAdjustments) {
    var discountIDs = [];
    var priceAdjustmentsIt = priceAdjustments.iterator();
    var priceAjustmentAmount = 0;
    var currencyCode = "";
    var data = {};
    while (priceAdjustmentsIt.hasNext()) {
      var priceAdjustment = priceAdjustmentsIt.next();
      priceAjustmentAmount += Math.abs(
        priceAdjustment.getBasePrice().getValue()
      );
      discountIDs.push(priceAdjustment.promotionID);
      currencyCode = priceAdjustment.getBasePrice().currencyCode;
    }
    if (priceAjustmentAmount != 0) {
      data.name = discountIDs.join(";");
      data.amount = {
        amount: Math.abs(priceAjustmentAmount).toFixed(2),
        currency: currencyCode,
      };
      return data;
    } else {
      return null;
    }
  },

  /**
   * Get Tamara's Payment ID base on SFCC Payment Method
   * @param {string} type - Payment method in SFCC
   * @returns {string} Tamara Payment ID
   */
  getPaymentTypeID: function (type) {
    switch (type) {
      case this.METHOD_TAMARA_PAYNOW:
        return this.PAY_NOW;
      case this.METHOD_TAMARA_PAY:
      case this.METHOD_PAY_BY_INSTALMENTS:
        return this.PAY_BY_INSTALMENTS;
      default:
        throw new Error(
          "tamaraHelper.getPaymentTypeID() Not found payment type: " + type
        );
    }
  },

  /**
   * Get web service instance base on service name
   * @param {string} serviceName - Service name
   * @returns {dw.svc.Service|any} Service object or empty object in case no relevant service
   */
  getService: function (serviceName) {
    const dwsvc = require("dw/svc");
    // Create the service config (used for all services)
    var tamaraService = null;

    try {
      tamaraService = dwsvc.LocalServiceRegistry.createService(serviceName, {
        createRequest: function (svc, args) {
          // svc.setRequestMethod('POST');
          svc.addHeader("Content-Type", "application/json");
          svc.addHeader("Accept", "application/json");
          svc.addHeader(
            "Authorization",
            "Bearer " + tamaraHelperObj.getAPIToken()
          );
          const url = svc.getURL();
          svc.setURL(tamaraHelperObj.getAPIEndPoint() + url);
          if (args) {
            return args;
          }
          return null;
        },
        parseResponse: function (svc, client) {
          return JSON.parse(client.text);
        },
        filterLogMessage: function (msg) {
          return msg;
        },
      });
      this.getTamaraLogger().debug(
        "Successfully retrive service with name {0}",
        serviceName
      );
    } catch (e) {
      this.getTamaraLogger().error(
        "Can't get service instance with name {0}. Error: {1}",
        serviceName,
        e.message
      );
    }
    return tamaraService;
  },

  /**
   * Detect whether a service call failed due to timeout
   * @param {dw.svc.Result} callResult - service call result
   * @returns {boolean} true when the failure was caused by a timeout
   */
  isServiceTimeout: function (callResult) {
    var errorMessage = (callResult.getErrorMessage() || "").toLowerCase();
    var unavailableMessage = (callResult.getMsg() || "").toLowerCase();
    var combinedError = errorMessage + " " + unavailableMessage;

    if (
      combinedError.indexOf("scriptingexception") !== -1 ||
      combinedError.indexOf("typeerror") !== -1
    ) {
      return false;
    }

    return (
      combinedError.indexOf("timed out") !== -1 ||
      combinedError.indexOf("time-out") !== -1 ||
      combinedError.indexOf("request timeout") !== -1 ||
      combinedError.indexOf("read timed out") !== -1 ||
      combinedError.indexOf("connection timed out") !== -1 ||
      combinedError.indexOf("socket timeout") !== -1
    );
  },

  /**
   * Get hard-coded Tamara payment label for the current country and language
   * @returns {{title: string, subtitle: string}} payment label
   */
  getPaymentLabel: function () {
    var countryCode = this.getCurrentCountryCode();
    var langCode = this.getCurrentLangCode();
    var countryLabels =
      this.PAYMENT_LABELS[countryCode] || this.PAYMENT_LABELS.SA;

    return countryLabels[langCode] || countryLabels.en;
  },

  /**
   * Apply payment labels to the payment types object
   * @param {object} paymentTypes - payment types object to update
   */
  applyPaymentLabels: function (paymentTypes) {
    var paymentLabel = this.getPaymentLabel();
    var title = paymentLabel.title || "";

    paymentTypes.paymentLabelTitle = title;
    paymentTypes.paymentLabelSubtitle = paymentLabel.subtitle || "";
    paymentTypes[this.METHOD_TAMARA_PAY] = title;
  },

  /**
   * Build default Tamara payment availability object
   * @returns {object} payment availability defaults
   */
  getDefaultPaymentTypes: function () {
    return {
      isEligible: false,
      isSingleCheckout: true,
      isEnableTamaraPay: false,
      isEnablePaynow: false,
      isEnableInstalments: false,
      payByInstalmentOptions: [],
      paymentLabelTitle: "",
      paymentLabelSubtitle: "",
    };
  },

  /**
   * Apply eligibility result and payment labels to the payment types object
   * @param {object} paymentTypes - payment types object to update
   * @param {boolean} isEligible - whether Tamara is eligible
   */
  applyEligibilityToPaymentTypes: function (paymentTypes, isEligible) {
    paymentTypes.isEligible = isEligible;
    paymentTypes.isEnableTamaraPay = isEligible;
    paymentTypes.isEnablePaynow = false;
    paymentTypes.isEnableInstalments = false;
    paymentTypes.isSingleCheckout = true;

    if (isEligible) {
      this.applyPaymentLabels(paymentTypes);
    }
  },

  /**
   * Build cache key for eligibility API responses
   * @param {object} data - order and customer data
   * @returns {string|null} cache key
   */
  buildEligibilityCacheKey: function (data) {
    if (!data.customer || !data.customer.phone_number) {
      return null;
    }

    return [
      data.customer.phone_number,
      data.order.amount,
      data.order.currency,
    ].join("_");
  },

  /**
   * Get available Tamara payment options for the current basket
   * @returns {object} Tamara payment availability and labels
   */
  getAvailablePayments: function () {
    var BasketMgr = require("dw/order/BasketMgr");
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
      return this.getDefaultPaymentTypes();
    }

    var phoneNumber = null;
    if (
      currentBasket.shipments.length &&
      currentBasket.shipments[0].shippingAddress
    ) {
      phoneNumber = currentBasket.shipments[0].shippingAddress.getPhone();
      phoneNumber = this.formatPhoneWithCountryCode(phoneNumber);
    }

    return this.fetchAvailablePayments({
      order: {
        amount: parseFloat(currentBasket.totalGrossPrice.value.toFixed(2)),
        currency: currentBasket.totalGrossPrice.currencyCode,
      },
      customer: {
        phone_number: phoneNumber,
        email: currentBasket.customerEmail || null,
      },
    });
  },

  /**
   * Get product widget
   * @param {object} productPrice
   * @return string
   */
  getProductWidget: function (productPrice) {
    let div = "";

    if (productPrice.type === "range") {
      return (
        `<tamara-widget type="tamara-summary" amount="` +
        productPrice.min.sales.decimalPrice +
        `" inline-type="2"></tamara-widget>`
      );
    }

    div =
      `<tamara-widget type="tamara-summary" amount="` +
      productPrice.sales.decimalPrice +
      `" inline-type="2"></tamara-widget>`;

    return div;
  },

  /**
   * Get checkout widget
   * @return string
   */
  getCheckoutWidget: function (numberOfInstallments, isSingleCheckout) {
    const CustomObjectMgr = require("dw/object/CustomObjectMgr");
    const currentBasket = require("dw/order/BasketMgr").getCurrentBasket();

    if (isSingleCheckout) {
      return (
        `<tamara-widget type="tamara-summary" amount="` +
        currentBasket.totalGrossPrice.getValue() +
        `" inline-type="3"></tamara-widget>`
      );
    }

    let widget = "";

    if (currentBasket) {
      widget =
        '<div class="tamara-installment-plan-widget" ' +
        'data-lang="' +
        tamaraHelperObj.getCurrentLangCode() +
        '" ' +
        'data-price="' +
        currentBasket.totalGrossPrice.getValue() +
        '" ' +
        'data-number-of-installments="' +
        numberOfInstallments +
        '" ' +
        'data-currency="' +
        currentBasket.currencyCode +
        '" ' +
        "></div>";
    }

    return widget;
  },
  /**
   * Authorised the checkout request
   * @param {object} req - The current order's number
   * @param {dw.order.Order} order - The current order's number
   * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
   * @param {string} source - the source Controller request this function - for tracking purpose
   * @return true
   */
  placeOrder: function (req, order, source) {
    const Transaction = require("dw/system/Transaction");
    const tamaraServiceAuthorised = require("*/cartridge/scripts/services/tamaraServiceAuthorised");
    const COHelpers = require("*/cartridge/scripts/checkout/checkoutHelpers");
    const Order = require("dw/order/Order");

    // authorised the order if not yet
    if (order.custom.tamaraPaymentStatus !== "authorised" && order.custom.tamaraPaymentStatus !== "fully_captured" && order.custom.tamaraPaymentStatus !== "fully_refunded") {
      tamaraServiceAuthorised.initService(order);
      Transaction.wrap(function () {
        order.trackOrderChange(
          source +
            ": " +
            Resource.msg("note.content.tamara.authorised", "tamara", null)
        );
      });
      tamaraServiceOrderDetail.initService(order, true);
    }

    // Check if order in SFCC has status failed. Then we need cancel tamara order
    if (Order.ORDER_STATUS_FAILED === order.getStatus().getValue()) {
      const tamaraOrderDetail = tamaraServiceOrderDetail.initService(order, false);
      const requestObject = {
        comment: 'Cancel the Tamara order because the SFCC order has a status of FAILED',
        amount: order.totalGrossPrice.getValue()
      }
      if (tamaraOrderDetail.status === 'authorised') {
        // Call Cancel API
        const tamaraServiceCancel = require('*/cartridge/scripts/services/tamaraServiceCancel');
        tamaraServiceCancel.initService(order, requestObject, requestObject.comment);
      }

      if (tamaraOrderDetail.status === 'fully_captured') {
        // Call Refund API
        const tamaraServiceRefund = require('*/cartridge/scripts/services/tamaraServiceRefund');
        tamaraServiceRefund.initService(order, requestObject, requestObject.comment);
      }

      return false;
    }

    // Places the order if not placed yet
    if (Order.ORDER_STATUS_CREATED === order.getStatus().getValue()) {
      var placeOrderResult = COHelpers.placeOrder(order, {
        status: true,
      });
      if (placeOrderResult.error) {
        throw new Error(
          "Tamara-Success: Not able to place order: " + order.orderNo
        );
      }
      Transaction.wrap(function () {
        order.trackOrderChange(
          source +
            ": " +
            Resource.msg("note.content.sfcc.placeorder", "tamara", null)
        );
      });

      if (order.getCustomerEmail()) {
        COHelpers.sendConfirmationEmail(order, req.locale.id);
      }

      // Reset usingMultiShip after successful Order placement
      req.session.privacyCache.set("usingMultiShipping", false);
    }

    return true;
  },

  /**
   * Capture order
   * @param {dw.order.Order} order - The current order's number
   * @param {string} trackingHistory - The tracking message
   * @return true
   */
  captureOrder: function (order, trackingHistory) {
    const Transaction = require("dw/system/Transaction");
    if (order.custom.tamaraPaymentStatus !== "fully_captured") {
      Transaction.wrap(function () {
        order.trackOrderChange(trackingHistory);
      });
      tamaraServiceOrderDetail.initService(order, true);
    }
  },

  /**
   * Refund an order
   * @param {dw.order.Order} order - The current order's number
   * @param {string} trackingHistory - The tracking message
   * @return true
   */
  refundOrder: function (order, trackingHistory) {
    const Transaction = require("dw/system/Transaction");
    if (order.custom.tamaraPaymentStatus !== "fully_refunded") {
      Transaction.wrap(function () {
        order.trackOrderChange(trackingHistory);
      });
      tamaraServiceOrderDetail.initService(order, true);
    }
  },

  /**
   * Refund an order
   * @param {dw.order.Order} order - The current order's number
   * @param {string} trackingHistory - The tracking message
   * @return true
   */
  cancelOrderTracking: function (order, trackingHistory) {
    const Transaction = require("dw/system/Transaction");
    if (order.custom.tamaraPaymentStatus !== "canceled") {
      Transaction.wrap(function () {
        order.trackOrderChange(trackingHistory);
      });
      tamaraServiceOrderDetail.initService(order, true);
    }
  },

  /**
   * Set order fail
   * @param {dw.order.Order} order - The current order's number
   * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
   * @param {string} source - the source Controller request this function - for tracking purpose
   * @return true
   */
  failedOrder: function (order, paymentInstrument, source) {
    const Transaction = require("dw/system/Transaction");
    const OrderMgr = require("dw/order/OrderMgr");
    const Order = require("dw/order/Order");

    if (
      ["declined", "expired"].indexOf(
        order.custom.tamaraPaymentStatus || ""
      ) === -1
    ) {
      Transaction.wrap(function () {
        if (order.getStatus().getValue() === Order.ORDER_STATUS_CREATED) {
          OrderMgr.failOrder(order, true);
          order.custom.tamaraPaymentStatus = "declined";
          order.trackOrderChange(
            source +
              ": " +
              Resource.msg("note.content.sfcc.failorder", "tamara", null)
          );
        } else {
          OrderMgr.cancelOrder(order);
          order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
          order.custom.tamaraPaymentStatus = "expired";
          order.trackOrderChange(
            source +
              ": " +
              Resource.msg("note.content.sfcc.cancelorder", "tamara", null)
          );
        }
      });

      tamaraServiceOrderDetail.initService(order, true);
    }
  },

  /**
   * Cancel an order from Tamara
   * @param {dw.order.Order} order - The current order's number
   * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
   * @param {string} source - the source Controller request this function - for tracking purpose
   * @return true
   */
  cancelOrder: function (order, paymentInstrument, source) {
    const Transaction = require("dw/system/Transaction");
    const OrderMgr = require("dw/order/OrderMgr");
    const Order = require("dw/order/Order");

    if (["canceled"].indexOf(order.custom.tamaraPaymentStatus || "") === -1) {
      Transaction.wrap(function () {
        if (order.getStatus().getValue() === Order.ORDER_STATUS_CREATED) {
          OrderMgr.failOrder(order, true);
          order.trackOrderChange(
            source +
              ": " +
              Resource.msg("note.content.sfcc.failorder2", "tamara", null)
          );
        } else {
          OrderMgr.cancelOrder(order);
          order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
          order.trackOrderChange(
            source +
              ": " +
              Resource.msg("note.content.sfcc.cancelorder", "tamara", null)
          );
        }
      });

      tamaraServiceOrderDetail.initService(order, true);
    }
  },

  /**
   * Get available payment types from Tamara eligibility API
   * @param {object} data - order and customer data
   * @return {object} payment availability object
   */
  fetchAvailablePayments: function (data) {
    const CustomObjectMgr = require("dw/object/CustomObjectMgr");
    const Transaction = require("dw/system/Transaction");
    const tamaraServicePaymentOptionsAvailable = require("*/cartridge/scripts/services/tamaraServicePaymentOptionsAvailable");
    var cachePreCheckAPI;
    var paymentTypes = this.getDefaultPaymentTypes();
    var cacheKey = this.buildEligibilityCacheKey(data);

    if (cacheKey) {
      cachePreCheckAPI = CustomObjectMgr.queryCustomObject(
        tamaraHelperObj.TAMARA_CACHE_API_OBJECT,
        "custom.ID = {0}",
        cacheKey
      );

      if (
        cachePreCheckAPI &&
        (new Date().getTime() - cachePreCheckAPI.lastModified.getTime()) /
          (1000 * 60) >=
          5
      ) {
        Transaction.wrap(function () {
          CustomObjectMgr.remove(cachePreCheckAPI);
        });
        cachePreCheckAPI = null;
      }
    }

    if (cachePreCheckAPI) {
      paymentTypes = JSON.parse(cachePreCheckAPI.getCustom()["content"]);

      if (paymentTypes.isEligible) {
        this.applyPaymentLabels(paymentTypes);
      }

      this.getTamaraLogger().info(
        "Tamara eligibility API cache hit for key {0}. Cached result: {1}",
        cacheKey,
        JSON.stringify({
          isEligible: paymentTypes.isEligible,
          isEnableTamaraPay: paymentTypes.isEnableTamaraPay,
        })
      );

      return paymentTypes;
    }

    if (!data.customer || !data.customer.phone_number) {
      this.getTamaraLogger().info(
        "Tamara eligibility API skipped: phone number not available yet"
      );
      return paymentTypes;
    }

    try {
      var eligibilityResponse =
        tamaraServicePaymentOptionsAvailable.initService(data);
      this.applyEligibilityToPaymentTypes(
        paymentTypes,
        eligibilityResponse.is_eligible === true
      );

      this.getTamaraLogger().info(
        "Tamara eligibility applied. is_eligible={0}, isEnableTamaraPay={1}",
        eligibilityResponse.is_eligible,
        paymentTypes.isEnableTamaraPay
      );
    } catch (e) {
      this.getTamaraLogger().error(
        "Tamara eligibility API error: {0}",
        e.message
      );
      this.applyEligibilityToPaymentTypes(paymentTypes, false);
    }

    if (cacheKey) {
      Transaction.wrap(function () {
        cachePreCheckAPI = CustomObjectMgr.createCustomObject(
          tamaraHelperObj.TAMARA_CACHE_API_OBJECT,
          cacheKey
        );

        cachePreCheckAPI.getCustom()["content"] = JSON.stringify(paymentTypes);
      });
    }

    return paymentTypes;
  },
};

module.exports = tamaraHelperObj;
