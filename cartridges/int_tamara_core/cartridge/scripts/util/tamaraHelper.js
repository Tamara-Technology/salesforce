/**
 *The helper for Tamara Payment
 */
const dwsystem = require('dw/system');
const dwutil = require('dw/util');
const Resource = require('dw/web/Resource');
const tamaraServiceOrderDetail = require('*/cartridge/scripts/services/tamaraServiceOrderDetail');

const preferenceCurrentSite = dwsystem.Site.getCurrent();

/* eslint no-var: off */
var tamaraHelperObj = {

	PROCESSOR_TAMARA: 'TAMARA',

	METHOD_TAMARA_PAYLATER: 'TAMARA_PAYLATER',

	METHOD_TAMARA_INSTALMENTS: 'TAMARA_3_INSTALMENTS',

	METHOD_TAMARA_6_INSTALMENTS: 'TAMARA_6_INSTALMENTS',

	PAY_BY_INSTALMENTS: 'PAY_BY_INSTALMENTS',

	PAY_BY_LATER: 'PAY_BY_LATER',

	METHOD_CREDIT_CARD: 'CREDIT_CARD',

	TAMARA_PAYMENTTYPES_OBJECT: 'TamaraPaymentTypes',

	SERVICE: {
		CHECKOUT: {
			SESSION: 'tamara.checkout.session',
			PAYMENTTYPES: 'tamara.checkout.paymenttypes',
		},
		ORDER: {
			AUTHORISED: 'tamara.order.authorised',
			DETAILED: 'tamara.order.detail',
			CANCEL: 'tamara.order.cancel',
		},
		WEBHOOK: {
			REGISTER: 'tamara.webhook.register'
		},
		PAYMENT: {
			CAPTURE: 'tamara.payment.capture',
			REFUND: 'tamara.payment.refund',
		}
	},
	ENCRYPT: {
		MODE: 'AES/CBC/PKCS5Padding',
		KEY: 'RmVJTjlTY0hEd1Mxa0FWOA==',
		IV: 'ZzFONFlQaXBLYmhuSzhVVw=='
	},

	/**
	 * Generate a token from a string
	 * @param {string} message a string of message you want to encrypt token
	 * @returns {string} encrypt message
	 */
	generateToken: function (message) {
		const Cipher = require('dw/crypto/Cipher');
		var crypto = new Cipher();
		return crypto.encrypt(message, this.ENCRYPT.KEY, this.ENCRYPT.MODE, this.ENCRYPT.IV, 0);
	},

	/**
	 * Decrypt a token
	 * @param {string} message a string of message you want to decrypt
	 * @returns {string} decrypt message
	 */
	decryptToken: function (message) {
		const Cipher = require('dw/crypto/Cipher');
		var crypto = new Cipher();
		return crypto.decrypt(message, this.ENCRYPT.KEY, this.ENCRYPT.MODE, this.ENCRYPT.IV, 0);
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
		return dwsystem.Logger.getLogger('Tamara', 'tamara');
	},

	/**
	 * Get logger for Tamara Payment
	 * @returns {dw.system.Log} a Log object with a "tamara" prefix name
	 */
	getTamaraBMLogger: function () {
		return dwsystem.Logger.getLogger('TamaraBM', 'tamara');
	},

	/**
	 * Get Tamara's custom preference attribute base on ID
	 * @param {string} field custom attribute's id
	 * @returns {any} a custom attributes for tamara payment preference
	 */
	getCustomPreference: function (field) {
		let customPreference = null;
		if (preferenceCurrentSite && preferenceCurrentSite.getCustomPreferenceValue(field)) {
			customPreference = preferenceCurrentSite.getCustomPreferenceValue(field);
		}
		return customPreference;
	},

	/**
	 * Get Tamara's enablement status
	 * @returns {any} a custom attributes value
	 */
	getEnablementStatus: function () {
		return this.getCustomPreference('tamaraEnablement') &&
			new dwutil.ArrayList(this.getCustomPreference('tamaraSupportedCountries')).indexOf(this.getCurrentCountryCode()) !== -1;
	},

	/**
	 * Get Tamara's Support Country
	 * @returns {any} a custom attributes value
	 */
	getSupportedCountriesAsString: function () {
		return new dwutil.ArrayList(this.getCustomPreference('tamaraSupportedCountries')).join(';');
	},

	/**
	 * Get Tamara's API Endpoint value
	 * @returns {any} a custom attributes value
	 */
	getAPIEndPoint: function () {
		return this.getCustomPreference('tamaraEndPoint');
	},

	/**
	 * Get Priority PDP Widget
	 * @returns {any} a custom attributes value
	 */
	getPriorityPDPWidget: function () {
		if (this.getCustomPreference('tamaraPriorityPDPWidget') === this.PAY_BY_INSTALMENTS && this.getNumberOfInstallments() == 3) {
			return this.METHOD_TAMARA_INSTALMENTS;
		}

		if (this.getCustomPreference('tamaraPriorityPDPWidget') === this.PAY_BY_INSTALMENTS && this.getNumberOfInstallments() == 6) {
			return this.METHOD_TAMARA_6_INSTALMENTS;
		}

		return this.METHOD_TAMARA_PAYLATER;
	},

	/**
	 * Get Number Of Installments
	 * @returns {any} a custom attributes value
	 */
	getNumberOfInstallments: function () {
		return this.getCustomPreference('tamaraNumberOfInstallments');
	},

	/**
	 * Get Tamara's APIToken value
	 * @returns {any} a custom attributes value
	 */
	getAPIToken: function () {
		return this.getCustomPreference('tamaraAPIToken');
	},

	/**
	 * Get Webhoook events supported
	 * @returns {any} a custom attributes value
	 */
	getWebhookEvents: function () {
		return this.getCustomPreference('tamaraWebhookEvents');
	},

	/**
	 * Get Tamara's Payment ID base on SFCC Payment Method
	 * @param {string} type - Payment method in SFCC
	 * @returns {string} Tamara Payment ID
	 */
	getPaymentTypeID: function (type) {
		switch (type) {
			case this.METHOD_TAMARA_INSTALMENTS:
			case this.METHOD_TAMARA_6_INSTALMENTS:
				return this.PAY_BY_INSTALMENTS;
			case this.METHOD_TAMARA_PAYLATER:
				return this.PAY_BY_LATER;
			default:
				throw new Error('tamaraHelper.getPaymentTypeID() Not found payment type: ' + type);
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
		const dwsvc = require('dw/svc');
		// Create the service config (used for all services)
		var tamaraService = null;

		try {
			tamaraService = dwsvc.LocalServiceRegistry.createService(serviceName, {
				createRequest: function (svc, args) {
					// svc.setRequestMethod('POST');
					svc.addHeader('Content-Type', 'application/json');
					svc.addHeader('Accept', 'application/json');
					svc.addHeader('Authorization', 'Bearer ' + tamaraHelperObj.getAPIToken());
					const url = svc.getURL();
					svc.setURL(tamaraHelperObj.getAPIEndPoint() + url);
					if (args) {
						return args;
					}
					return null;
				},
				parseResponse: function (svc, client) {
					return JSON.parse(client.text)
				},
				filterLogMessage: function (msg) {
					return msg;
				},
			});
			this.getTamaraLogger().debug(
				'Successfully retrive service with name {0}',
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
		const currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
		let isInstalmentValid = false;
		let isPaylaterValid = false;
		let is6InstalmentValid = false;
		const paymentTypes = this.fetchSupportedPayments();

		paymentTypes.forEach(object => {
			let ptype = JSON.parse(object.getCustom()['content']);

			if (!ptype.hasOwnProperty('name') || !ptype.hasOwnProperty('max_limit') || !ptype.hasOwnProperty('min_limit')) {
				throw new Error('Error in tamaraHelper.getAllowPaymentRange() | Message: Tamara API doesn\'t not response the right Min/MAX value: ' + JSON.stringify(paymentTypes));
			}

			if (ptype.name == this.METHOD_TAMARA_PAYLATER) {
				isPaylaterValid = !!currentBasket && currentBasket.totalGrossPrice >= ptype.min_limit.amount && currentBasket.totalGrossPrice <= ptype.max_limit.amount;
			} else if (ptype.name == this.METHOD_TAMARA_INSTALMENTS) {
				isInstalmentValid = !!currentBasket && currentBasket.totalGrossPrice >= ptype.min_limit.amount && currentBasket.totalGrossPrice <= ptype.max_limit.amount;
			} else if (ptype.name === this.METHOD_TAMARA_6_INSTALMENTS) {
				is6InstalmentValid = !!currentBasket && currentBasket.totalGrossPrice >= ptype.min_limit.amount && currentBasket.totalGrossPrice <= ptype.max_limit.amount;
			}
		});

		return {
			"isPaylaterValid": isPaylaterValid,
			"isInstalmentValid": isInstalmentValid,
			"is6InstalmentValid": is6InstalmentValid
		};
	},

	/**
	 * Get product widget
	 * @param {object} productPrice
	 * @return string
	 */
	getProductWidget: function (productPrice) {
		let widget = '';
		let div = '';
		let maxPayLater = 0;
		let paymentTypes = this.fetchSupportedPayments();

		let shouldSkip = false;
		let _this = this;

		paymentTypes.forEach(function (object) {
			if (shouldSkip) {
				return;
			}

			let ptype = JSON.parse(object.getCustom()['content']);
			if (productPrice.sales.decimalPrice >= ptype.min_limit.amount && productPrice.sales.decimalPrice <= ptype.max_limit.amount) {
				if (ptype.name == _this.getPriorityPDPWidget()) {
					widget = _this.getPriorityPDPWidget();
					shouldSkip = true;
				} else {
					widget = ptype.name;
				}

				if (ptype.name == _this.METHOD_TAMARA_PAYLATER) {
					maxPayLater = ptype.max_limit.amount
				}
			}
		});

		if (widget == this.METHOD_TAMARA_INSTALMENTS) {
			div = '<div class="tamara-product-widget" data-lang="' + tamaraHelperObj.getCurrentLangCode() + '" data-price="' + productPrice.sales.decimalPrice + '" data-currency="' + productPrice.sales.currency + '" data-country-code="'+ this.getSupportedCountriesAsString() + '" data-payment-type="installment" data-disable-installment="false" data-disable-paylater="true"></div>';
		} else if (widget == this.METHOD_TAMARA_6_INSTALMENTS) {
			div = '<div class="tamara-product-widget" data-lang="' + tamaraHelperObj.getCurrentLangCode() + '" data-price="' + productPrice.sales.decimalPrice + '" data-currency="' + productPrice.sales.currency + '" data-number-of-installments="6" data-country-code="'+ this.getSupportedCountriesAsString() + '" data-payment-type="installment" data-disable-installment="false" data-disable-paylater="true"></div>';
		} else if (widget == this.METHOD_TAMARA_PAYLATER) {
			div = '<div class="tamara-product-widget" data-disable-paylater="false" data-pay-later-max-amount="' + maxPayLater + '" data-lang="' + tamaraHelperObj.getCurrentLangCode() + '"></div>';
		}

		return div;
	},

	/**
	 * Get checkout widget
	 * @return string
	 */
	getCheckoutWidget: function (numberOfInstallments) {
		const CustomObjectMgr = require('dw/object/CustomObjectMgr');
		const currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
		let installment = null;

		if (numberOfInstallments == 3) {
			installment = CustomObjectMgr.getCustomObject(tamaraHelperObj.TAMARA_PAYMENTTYPES_OBJECT, this.METHOD_TAMARA_INSTALMENTS);
		} else if (numberOfInstallments == 6) {
			installment = CustomObjectMgr.getCustomObject(tamaraHelperObj.TAMARA_PAYMENTTYPES_OBJECT, this.METHOD_TAMARA_6_INSTALMENTS);
		}

		let widget = '';

		if (installment && currentBasket) {
			const ptype = JSON.parse(installment.getCustom()['content']);
			widget = '<div class="tamara-installment-plan-widget" '
				+ 'data-lang="' + tamaraHelperObj.getCurrentLangCode() + '" '
				+ 'data-price="' + currentBasket.totalGrossPrice.getValue() + '" '
				+ 'data-installment-minimum-amount="' + ptype.min_limit.amount + '" '
				+ 'data-installment-maximum-amount="' + ptype.max_limit.amount + '" '
				+ 'data-number-of-installments="' + numberOfInstallments + '" '
				+ 'data-currency="' + currentBasket.currencyCode + '" '
				+ '></div>';
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
	placeOrder: function (req, order, paymentInstrument, source) {

		const Transaction = require('dw/system/Transaction');
		const tamaraServiceAuthorised = require('*/cartridge/scripts/services/tamaraServiceAuthorised');
		const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
		const Order = require('dw/order/Order');

		// authorised the order if not yet
		if (order.custom.tamaraPaymentStatus !== 'authorised') {
			tamaraServiceAuthorised.initService(order, paymentInstrument);
			Transaction.wrap(function () {
				order.trackOrderChange(source + ': ' + Resource.msg('note.content.tamara.authorised', 'tamara', null));
			});
			tamaraServiceOrderDetail.initService(order, true);
		}

		// Places the order if not placed yet
		if (Order.ORDER_STATUS_CREATED === order.getStatus().getValue()) {
			var placeOrderResult = COHelpers.placeOrder(order, {
				status: true
			});
			if (placeOrderResult.error) {
				throw new Error(
					'Tamara-Success: Not able to place order: ' + order.orderNo
				);
			}
			Transaction.wrap(function () {
				order.trackOrderChange(source + ': ' + Resource.msg('note.content.sfcc.placeorder', 'tamara', null));
			});

			if (order.getCustomerEmail()) {
				COHelpers.sendConfirmationEmail(order, req.locale.id);
			}

			// Reset usingMultiShip after successful Order placement
			req.session.privacyCache.set('usingMultiShipping', false);

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
		const Transaction = require('dw/system/Transaction');
		if (order.custom.tamaraPaymentStatus !== 'fully_captured') {
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
		const Transaction = require('dw/system/Transaction');
		if (order.custom.tamaraPaymentStatus !== 'fully_refunded') {
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
		const Transaction = require('dw/system/Transaction');
		if (order.custom.tamaraPaymentStatus !== 'canceled') {
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
		const Transaction = require('dw/system/Transaction');
		const OrderMgr = require('dw/order/OrderMgr');
		const Order = require('dw/order/Order');

		if (['declined', 'expired'].indexOf(order.custom.tamaraPaymentStatus || '') === -1) {
			Transaction.wrap(function () {
				if (order.getStatus().getValue() === Order.ORDER_STATUS_CREATED) {
					OrderMgr.failOrder(order, true);
					order.custom.tamaraPaymentStatus = 'declined';
					order.trackOrderChange(source + ': ' + Resource.msg('note.content.sfcc.failorder', 'tamara', null));
				} else {
					OrderMgr.cancelOrder(order);
					order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
					order.custom.tamaraPaymentStatus = 'expired';
					order.trackOrderChange(source + ': ' + Resource.msg('note.content.sfcc.cancelorder', 'tamara', null));
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
		const Transaction = require('dw/system/Transaction');
		const OrderMgr = require('dw/order/OrderMgr');
		const Order = require('dw/order/Order');

		if (['canceled'].indexOf(order.custom.tamaraPaymentStatus || '') === -1) {
			Transaction.wrap(function () {
				if (order.getStatus().getValue() === Order.ORDER_STATUS_CREATED) {
					OrderMgr.failOrder(order, true);
					order.trackOrderChange(source + ': ' + Resource.msg('note.content.sfcc.failorder2', 'tamara', null));
				} else {
					OrderMgr.cancelOrder(order);
					order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
					order.trackOrderChange(source + ': ' + Resource.msg('note.content.sfcc.cancelorder', 'tamara', null));
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
		const CustomObjectMgr = require('dw/object/CustomObjectMgr');
		const Transaction = require('dw/system/Transaction');
		const tamaraServicePaymentTypes = require('*/cartridge/scripts/services/tamaraServicePaymentTypes');

		var paymentTypes = CustomObjectMgr.queryCustomObjects(tamaraHelperObj.TAMARA_PAYMENTTYPES_OBJECT, "", "creationDate ASC").asList().toArray();

		// Delete the exsting objects of they are created since more than 30 mins before
		if (paymentTypes.length > 0 && (new Date().getTime() - paymentTypes[0].lastModified.getTime()) / (1000 * 60) >= 30) {
			Transaction.wrap(() => paymentTypes.forEach((paymentType) => CustomObjectMgr.remove(paymentType)));
			paymentTypes = [];
		}

		//If no any existing objects, we fetch the latest object from Tamara API
		if (paymentTypes.length === 0) {
			const latestPaymentTypes = tamaraServicePaymentTypes.initService();
			Transaction.wrap(() => {
				latestPaymentTypes.forEach(paymentType => {
					const paymentTypeName = paymentType['name'];

					if ('PAY_BY_INSTALMENTS' === paymentTypeName) {
						const supportedInstalments = paymentType['supported_instalments'];
						supportedInstalments.forEach(supportedInstalment => {
							if (supportedInstalment['instalments'] === 3) {
								supportedInstalment['name'] = this.METHOD_TAMARA_INSTALMENTS;
								let type = CustomObjectMgr.createCustomObject(tamaraHelperObj.TAMARA_PAYMENTTYPES_OBJECT, this.METHOD_TAMARA_INSTALMENTS);
								type.getCustom()['content'] = JSON.stringify(supportedInstalment);
								paymentTypes.push(type);
							} else if (supportedInstalment['instalments'] === 6) {
								supportedInstalment['name'] = this.METHOD_TAMARA_6_INSTALMENTS;
								let type = CustomObjectMgr.createCustomObject(tamaraHelperObj.TAMARA_PAYMENTTYPES_OBJECT, this.METHOD_TAMARA_6_INSTALMENTS);
								type.getCustom()['content'] = JSON.stringify(supportedInstalment);
								paymentTypes.push(type);
							}
						});
					} else {
						paymentType['name'] = this.METHOD_TAMARA_PAYLATER;
						const type = CustomObjectMgr.createCustomObject(tamaraHelperObj.TAMARA_PAYMENTTYPES_OBJECT, this.METHOD_TAMARA_PAYLATER);
						type.getCustom()['content'] = JSON.stringify(paymentType);
						paymentTypes.push(type);
					}
				});
			});
		}


		return paymentTypes;
	}
};

module.exports = tamaraHelperObj;