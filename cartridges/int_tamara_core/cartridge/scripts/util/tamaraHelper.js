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

	METHOD_TAMARA_INSTALMENTS: 'TAMARA_INSTALMENTS',

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
		return this.getCustomPreference('tamaraPriorityPDPWidget');
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
	 * Get Tamara's PaylaterID
	 * @returns {any} a custom attributes value
	 */
	getPaylaterID: function () {
		return this.getCustomPreference('tamaraPaylaterID');
	},

	/**
	 * Get Tamara's InstalmentsID
	 * @returns {any} a custom attributes value
	 */
	getInstalmentsID: function () {
		return this.getCustomPreference('tamaraInstalmentsID');
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
		if (type == this.METHOD_TAMARA_INSTALMENTS) {
			return this.getInstalmentsID();
		} else if (type == this.METHOD_TAMARA_PAYLATER) {
			return this.getPaylaterID();
		} else {
			throw new Error('tamaraHelper.getPaymentTypeID() Not found related payment for method: ' + type);
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
		var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
		var isInstalmentValid = false;
		var isPaylaterValid = false;
		var paymentTypes = this.fetchSupportedPayments();

		paymentTypes.forEach(function (object) {
			let ptype = JSON.parse(object.getCustom()['content']);
			if (!ptype.hasOwnProperty('name') || !ptype.hasOwnProperty('max_limit') || !ptype.hasOwnProperty('min_limit')) {
				throw new Error('Error in tamaraHelper.getAllowPaymentRange() | Message: Tamara API doesn\'t not response the right Min/MAX value: ' + JSON.stringify(paymentTypes));
			}

			if (ptype.name == tamaraHelperObj.getPaylaterID()) {
				isPaylaterValid = !!currentBasket && currentBasket.totalGrossPrice >= ptype.min_limit.amount && currentBasket.totalGrossPrice <= ptype.max_limit.amount;
			} else if (ptype.name == tamaraHelperObj.getInstalmentsID()) {
				isInstalmentValid = !!currentBasket && currentBasket.totalGrossPrice >= ptype.min_limit.amount && currentBasket.totalGrossPrice <= ptype.max_limit.amount;
			}
		});

		return {
			"isPaylaterValid": isPaylaterValid,
			"isInstalmentValid": isInstalmentValid
		};
	},

	/**
	 * Get product widget
	 * @param {object} productPrice
	 * @return string
	 */
	getProductWidget: function (productPrice) {
		var widget = '';
		var div = '';
		var maxPayLater = 0;
		var paymentTypes = this.fetchSupportedPayments();

		let shouldSkip = false;
		paymentTypes.forEach(function (object) {
			if (shouldSkip) {
				return;
			}

			let ptype = JSON.parse(object.getCustom()['content']);
			if (productPrice.sales.decimalPrice >= ptype.min_limit.amount && productPrice.sales.decimalPrice <= ptype.max_limit.amount) {
				if (ptype.name == tamaraHelperObj.getPriorityPDPWidget()) {
					widget = tamaraHelperObj.getPriorityPDPWidget();
					shouldSkip = true;
				} else {
					widget = ptype.name;
				}

				if (ptype.name == tamaraHelperObj.getPaylaterID()) {
					maxPayLater = ptype.max_limit.amount
				}
			}
		});

		if (widget == tamaraHelperObj.getInstalmentsID()) {
			div = '<div class="tamara-product-widget" data-price="' + productPrice.sales.decimalPrice + '" data-currency="' + productPrice.sales.currency + '" data-lang="' + tamaraHelperObj.getCurrentLangCode() + '"></div>';
		} else if (widget == tamaraHelperObj.getPaylaterID()) {
			div = '<div class="tamara-product-widget" data-disable-paylater="false" data-pay-later-max-amount="' + maxPayLater + '" data-lang="' + tamaraHelperObj.getCurrentLangCode() + '"></div>';
		}

		return div;
	},

	/**
	 * Get checkout widget
	 * @return string
	 */
	getCheckoutWidget: function () {
		const CustomObjectMgr = require('dw/object/CustomObjectMgr');
		var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
		var installment = CustomObjectMgr.getCustomObject(tamaraHelperObj.TAMARA_PAYMENTTYPES_OBJECT, tamaraHelperObj.getInstalmentsID());
		var widget = '';

		if(installment){
			var ptype = JSON.parse(installment.getCustom()['content']);
			widget = '<div class="tamara-installment-plan-widget" '
			+ 'data-lang="' + tamaraHelperObj.getCurrentLangCode() + '" ' 
			+ 'data-price="' + currentBasket.totalGrossPrice.getValue() + '" ' 
			+ 'data-installment-minimum-amount="' + ptype.min_limit.amount + '" ' 
			+ 'data-installment-maximum-amount="' + ptype.max_limit.amount + '" ' 
			+ 'data-number-of-installments="' + tamaraHelperObj.getNumberOfInstallments() + '" ' 
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

		var tamaraOrder = tamaraServiceOrderDetail.initService(order, true);

		if (['cancelled', 'canceled'].indexOf(tamaraOrder.status) !== -1 && ['cancelled', 'canceled'].indexOf(order.custom.tamaraPaymentStatus || '') === -1) {
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
		if (paymentTypes.length === 1 || (paymentTypes.length > 0 && (new Date().getTime() - paymentTypes[0].lastModified.getTime()) / (1000 * 60) >= 30)) {
			Transaction.wrap(function () {
				paymentTypes.forEach(function (paymentType) {
					CustomObjectMgr.remove(paymentType);
				});
			});
			paymentTypes = [];
		}

		//If no any existing objects, we fetch the latest object from Tamara API
		if (paymentTypes.length === 0) {
			const latestPaymentTypes = tamaraServicePaymentTypes.initService();
			Transaction.wrap(function () {
				latestPaymentTypes.forEach(function (paymentType) {
					const type = CustomObjectMgr.createCustomObject(tamaraHelperObj.TAMARA_PAYMENTTYPES_OBJECT, paymentType['name']);
					type.getCustom()['content'] = JSON.stringify(paymentType);
					paymentTypes.push(type);
				});
			});
		}


		return paymentTypes;
	}
};

module.exports = tamaraHelperObj;