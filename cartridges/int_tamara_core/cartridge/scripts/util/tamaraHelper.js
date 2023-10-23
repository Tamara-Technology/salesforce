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

  METHOD_TAMARA_INSTALMENTS: "TAMARA_3_INSTALMENTS",

  METHOD_TAMARA_6_INSTALMENTS: "TAMARA_6_INSTALMENTS",

  PAY_NOW: "PAY_NOW",

  PAY_LATER: "PAY_NEXT_MONTH",

  PAY_BY_INSTALMENTS: "PAY_BY_INSTALMENTS",

  METHOD_CREDIT_CARD: "CREDIT_CARD",

  TAMARA_PAYMENTTYPES_OBJECT: "TamaraPaymentTypes",

  TAMARA_CACHE_API_OBJECT: "TamaraCachePaymentOptionsPreCheckAPI",

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
   * Get Priority PDP Widget
   * @returns {any} a custom attributes value
   */
  getPriorityPDPWidget: function () {
    if (
      this.getCustomPreference("tamaraPriorityPDPWidgets").value ===
      this.METHOD_TAMARA_INSTALMENTS
    ) {
      return this.METHOD_TAMARA_INSTALMENTS;
    }

    if (
      this.getCustomPreference("tamaraPriorityPDPWidgets").value ===
      this.METHOD_TAMARA_6_INSTALMENTS
    ) {
      return this.METHOD_TAMARA_6_INSTALMENTS;
    }
  },
  /**
   * Get Priority PDP Widget
   * @returns {any} a custom attributes value
   */
  getPriorityCartWidget: function () {
    if (
      this.getCustomPreference("tamaraPriorityCartWidgets").value ===
      this.METHOD_TAMARA_INSTALMENTS
    ) {
      return this.METHOD_TAMARA_INSTALMENTS;
    }

    if (
      this.getCustomPreference("tamaraPriorityCartWidgets").value ===
      this.METHOD_TAMARA_6_INSTALMENTS
    ) {
      return this.METHOD_TAMARA_6_INSTALMENTS;
    }
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
      case this.METHOD_TAMARA_INSTALMENTS:
      case this.METHOD_TAMARA_6_INSTALMENTS:
        return this.PAY_BY_INSTALMENTS;
      default:
        throw new Error(
          "tamaraHelper.getPaymentTypeID() Not found payment type: " + type
        );
    }
  },

  getInstallments: function (type) {
    switch (type) {
      case this.METHOD_TAMARA_6_INSTALMENTS:
        return 6;
      default:
        return 3;
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
   * Calculate the Range that Tamara allows to make the payment
   * @param {dw.util.Collection} paymentTypes - The list of Payment Types
   * Array of (
   *  {
   *    "name": "STRING",
   *    "description": "STRING",
   *    "min_limit": {
   *      "amount": NUMBER,
   *      "currency": "STRING"
   *    },
   *    "max_limit": {
   *      "amount": NUMBER,
   *      "currency": "STRING"
   *    }
   *  }
   * )
   * @returns {object} an Min/Max Object base on the input
   */
  getSupportedPayments: function () {
    const currentBasket = require("dw/order/BasketMgr").getCurrentBasket();
    let isInstalmentValid = false;
    let is6InstalmentValid = false;
    const paymentTypes = this.fetchSupportedPayments();

    paymentTypes.forEach((object) => {
      let ptype = JSON.parse(object.getCustom()["content"]);

      if (
        !ptype.hasOwnProperty("name") ||
        !ptype.hasOwnProperty("max_limit") ||
        !ptype.hasOwnProperty("min_limit")
      ) {
        throw new Error(
          "Error in tamaraHelper.getAllowPaymentRange() | Message: Tamara API doesn't not response the right Min/MAX value: " +
            JSON.stringify(paymentTypes)
        );
      }

      if (ptype.name == this.METHOD_TAMARA_INSTALMENTS) {
        isInstalmentValid =
          !!currentBasket &&
          currentBasket.totalGrossPrice >= ptype.min_limit.amount &&
          currentBasket.totalGrossPrice <= ptype.max_limit.amount;
      } else if (ptype.name === this.METHOD_TAMARA_6_INSTALMENTS) {
        is6InstalmentValid =
          !!currentBasket &&
          currentBasket.totalGrossPrice >= ptype.min_limit.amount &&
          currentBasket.totalGrossPrice <= ptype.max_limit.amount;
      }
    });

    return {
      isInstalmentValid: isInstalmentValid,
      is6InstalmentValid: is6InstalmentValid,
    };
  },

  /**
   * Get allows to make the payment from Tamara
   * @param {dw.util.Collection} paymentTypes - The list of Payment Types
   * Array of (
      {
      "payment_type": "PAY_NOW",
      "instalment": 0,
      "description": "Pay in full using Tamara",
      "description_ar": "ادفعها على دفعة واحدة باستعمال تمارا"
      }
   * )
   * @returns {object} an Min/Max Object base on the input
   */
  getAvailablePayments: function () {
    var BasketMgr = require("dw/order/BasketMgr");
    var currentBasket = BasketMgr.getCurrentBasket();

    const paymentTypes = this.fetchAvailablePayments({
      order_value: {
        amount: currentBasket.totalGrossPrice.value.toFixed(2),
        currency: currentBasket.totalGrossPrice.currencyCode,
      },
      phone_number:
        currentBasket.shipments.length &&
        currentBasket.shipments[0].shippingAddress
          ? currentBasket.shipments[0].shippingAddress.getPhone()
          : null,
      is_vip: true,
    });

    return paymentTypes;
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
    let installment = null;

    if (isSingleCheckout) {
      return (
        `<tamara-widget type="tamara-summary" amount="` +
        currentBasket.totalGrossPrice.getValue() +
        `" inline-type="3"></tamara-widget>`
      );
    }

    if (numberOfInstallments == 3) {
      installment = CustomObjectMgr.getCustomObject(
        tamaraHelperObj.TAMARA_PAYMENTTYPES_OBJECT,
        this.METHOD_TAMARA_INSTALMENTS
      );
    } else if (numberOfInstallments == 6) {
      installment = CustomObjectMgr.getCustomObject(
        tamaraHelperObj.TAMARA_PAYMENTTYPES_OBJECT,
        this.METHOD_TAMARA_6_INSTALMENTS
      );
    }

    let widget = "";

    if (installment && currentBasket) {
      const ptype = JSON.parse(installment.getCustom()["content"]);
      widget =
        '<div class="tamara-installment-plan-widget" ' +
        'data-lang="' +
        tamaraHelperObj.getCurrentLangCode() +
        '" ' +
        'data-price="' +
        currentBasket.totalGrossPrice.getValue() +
        '" ' +
        'data-installment-minimum-amount="' +
        ptype.min_limit.amount +
        '" ' +
        'data-installment-maximum-amount="' +
        ptype.max_limit.amount +
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

    this.updateOrderAfterAuthorized(order);

    // authorised the order if not yet
    if (order.custom.tamaraPaymentStatus !== "authorised") {
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
   * Update order after authorized
   * @param {*} order order
   */
  updateOrderAfterAuthorized: function (order) {
    const PaymentManager = require("dw/order/PaymentMgr");
    const Transaction = require("dw/system/Transaction");
    const _this = this;
    var orderDetails = tamaraServiceOrderDetail.initService(order, false);
    var paymentMethodID;

    if (
      orderDetails["payment_type"] === this.PAY_BY_INSTALMENTS &&
      orderDetails["instalments"] === 6
    ) {
      paymentMethodID = this.METHOD_PAY_BY_INSTALMENTS;
    } else if (
      orderDetails["payment_type"] === this.PAY_BY_INSTALMENTS &&
      orderDetails["instalments"] === 3
    ) {
      paymentMethodID = this.METHOD_PAY_BY_INSTALMENTS;
    } else if (orderDetails["payment_type"] === this.PAY_NOW) {
      paymentMethodID = this.METHOD_TAMARA_PAYNOW;
    } else if (orderDetails["payment_type"] === this.PAY_LATER) {
      paymentMethodID = this.METHOD_TAMARA_PAYLATER;
    }

    try {
      if (paymentMethodID) {
        Transaction.wrap(function () {
          collections.forEach(order.getPaymentInstruments(), function (item) {
            order.removePaymentInstrument(item);
          });

          var orderPaymentInstrument = order.createPaymentInstrument(
            paymentMethodID,
            order.totalGrossPrice
          );

          if (
            !PaymentManager.getPaymentMethod(paymentMethodID).paymentProcessor
          ) {
            return _this
              .getTamaraLogger()
              .error("Can't get payment processor. Need Admin to check soon");
          }

          var paymentProcessor =
            PaymentManager.getPaymentMethod(
              paymentMethodID
            ).getPaymentProcessor();

          orderPaymentInstrument.paymentTransaction.setTransactionID(
            order.getOrderNo()
          );
          orderPaymentInstrument.paymentTransaction.setPaymentProcessor(
            paymentProcessor
          );

          if (orderDetails["payment_type"] === _this.PAY_BY_INSTALMENTS) {
            orderPaymentInstrument.paymentTransaction.custom.tamaraInstalmentNumber =
              orderDetails["instalments"].toString();
          }
        });
      }
    } catch (e) {
      var a = e;
      var b = a;
      _this
        .getTamaraLogger()
        .error(
          "Can't update the order details after Authorized success. Need Admin to check soon"
        );
    }
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
   * Get supported payment types
   * @param {string} source - the source Controller request this function - for tracking purpose
   * @return object
   */
  fetchSupportedPayments: function () {
    const CustomObjectMgr = require("dw/object/CustomObjectMgr");
    const Transaction = require("dw/system/Transaction");
    const tamaraServicePaymentTypes = require("*/cartridge/scripts/services/tamaraServicePaymentTypes");

    var paymentTypes = CustomObjectMgr.queryCustomObjects(
      tamaraHelperObj.TAMARA_PAYMENTTYPES_OBJECT,
      "",
      "creationDate ASC"
    )
      .asList()
      .toArray();

    // Delete the exsting objects of they are created since more than 30 mins before
    if (
      paymentTypes.length > 0 &&
      (new Date().getTime() - paymentTypes[0].lastModified.getTime()) /
        (1000 * 60) >=
        30
    ) {
      Transaction.wrap(() =>
        paymentTypes.forEach((paymentType) =>
          CustomObjectMgr.remove(paymentType)
        )
      );
      paymentTypes = [];
    }

    //If no any existing objects, we fetch the latest object from Tamara API
    if (paymentTypes.length === 0) {
      const latestPaymentTypes = tamaraServicePaymentTypes.initService();
      Transaction.wrap(() => {
        latestPaymentTypes.forEach((paymentType) => {
          const paymentTypeName = paymentType["name"];

          if ("PAY_BY_INSTALMENTS" === paymentTypeName) {
            const supportedInstalments = paymentType["supported_instalments"];
            supportedInstalments.forEach((supportedInstalment) => {
              if (supportedInstalment["instalments"] === 3) {
                supportedInstalment["name"] = this.METHOD_TAMARA_INSTALMENTS;
                let type = CustomObjectMgr.createCustomObject(
                  tamaraHelperObj.TAMARA_PAYMENTTYPES_OBJECT,
                  this.METHOD_TAMARA_INSTALMENTS
                );
                type.getCustom()["content"] =
                  JSON.stringify(supportedInstalment);
                paymentTypes.push(type);
              } else if (supportedInstalment["instalments"] === 6) {
                supportedInstalment["name"] = this.METHOD_TAMARA_6_INSTALMENTS;
                let type = CustomObjectMgr.createCustomObject(
                  tamaraHelperObj.TAMARA_PAYMENTTYPES_OBJECT,
                  this.METHOD_TAMARA_6_INSTALMENTS
                );
                type.getCustom()["content"] =
                  JSON.stringify(supportedInstalment);
                paymentTypes.push(type);
              }
            });
          }
        });
      });
    }

    return paymentTypes;
  },

  /**
   * Get available payment types
   * @param {string} source - the source Controller request this function - for tracking purpose
   * @return object
   */
  fetchAvailablePayments: function (data) {
    const CustomObjectMgr = require("dw/object/CustomObjectMgr");
    const Transaction = require("dw/system/Transaction");
    const tamaraServicePaymentOptionsAvailable = require("*/cartridge/scripts/services/tamaraServicePaymentOptionsAvailable");
    var cachePreCheckAPI;

    paymentTypes = {
      isSingleCheckout: false,
      isEnableTamaraPay: false,
      isEnablePaynow: false,
      isEnableInstalments: false,
      is6InstalmentsEnabled: false,
    };

    if (data["phone_number"]) {
      cachePreCheckAPI = CustomObjectMgr.queryCustomObject(
        tamaraHelperObj.TAMARA_CACHE_API_OBJECT,
        "custom.ID = {0}",
        data["phone_number"]
      );

      if (
        cachePreCheckAPI &&
        (new Date().getTime() - cachePreCheckAPI.lastModified.getTime()) /
          (1000 * 60) >=
          5
      ) {
        Transaction.wrap(() => {
          CustomObjectMgr.remove(cachePreCheckAPI);
        });
        cachePreCheckAPI = null;
      }
    }

    if (!cachePreCheckAPI) {
      const availablePaymentsResponse =
        tamaraServicePaymentOptionsAvailable.initService(data);

      paymentTypes.isSingleCheckout =
        availablePaymentsResponse["single_checkout_enabled"];

      const langDesc = tamaraHelperObj.getCurrentLangCode() === 'ar' ? 'description_ar' : 'description_en';

      availablePaymentsResponse.available_payment_labels.forEach(
        (available_payment_label) => {
          if (available_payment_label["payment_type"] === this.PAY_NOW) {
            paymentTypes.isEnablePaynow = true;
            paymentTypes[this.METHOD_TAMARA_PAYNOW] =
              available_payment_label[langDesc];
          }

          if (
            available_payment_label["payment_type"] ===
              this.PAY_BY_INSTALMENTS &&
            available_payment_label["instalment"] === 0
          ) {
            paymentTypes.isEnableTamaraPay = true;
            paymentTypes[this.METHOD_TAMARA_PAY] =
              available_payment_label[langDesc];
          }

          if (
            available_payment_label["payment_type"] ===
              this.PAY_BY_INSTALMENTS &&
            available_payment_label["instalment"] === 3
          ) {
            paymentTypes.isEnableInstalments = true;
            paymentTypes[this.METHOD_TAMARA_INSTALMENTS] =
              available_payment_label[langDesc];
          }

          if (
            available_payment_label["payment_type"] ===
              this.PAY_BY_INSTALMENTS &&
            available_payment_label["instalment"] === 6
          ) {
            paymentTypes.is6InstalmentsEnabled = true;
            paymentTypes[this.METHOD_TAMARA_6_INSTALMENTS] =
              available_payment_label[langDesc];
          }
        }
      );

      if (data["phone_number"]) {
        Transaction.wrap(function () {
          cachePreCheckAPI = CustomObjectMgr.createCustomObject(
            tamaraHelperObj.TAMARA_CACHE_API_OBJECT,
            data["phone_number"]
          );

          cachePreCheckAPI.getCustom()["content"] =
            JSON.stringify(paymentTypes);
        });
      }

      return paymentTypes;
    }

    return JSON.parse(cachePreCheckAPI.getCustom()["content"]);
  },
};

module.exports = tamaraHelperObj;
