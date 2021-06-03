var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var tamaraHelper = require('*/cartridge/scripts/util/tamaraHelper');

/* eslint no-var: off */
var tamaraServiceCheckout = {

    /**
     * Create Session Object Request for first step of Tamara's Checkout process
     * @param {string} orderNumber - The current order's number
     * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
     * @return {Object} returns an object or throw an error message
     */
    initCheckoutSessionObject: function(orderNumber, paymentInstrument){

        const order = require('dw/order/OrderMgr').getOrder(orderNumber);
        if(!order) {
            throw Error('tamaraRequestObject.initCheckoutSessionObject(): Can not get the order from orderNumber ' + orderNumber);
        }

        const shippingAddress = order.getShipments().toArray()[0].getShippingAddress();
        if(!shippingAddress) {
            throw Error('tamaraRequestObject.initCheckoutSessionObject(): Missing shippingAddress in orderNumber ' + orderNumber);
        }
        const billingAddress = order.getBillingAddress();
        if(!billingAddress) {
            throw Error('tamaraRequestObject.initCheckoutSessionObject(): Missing billingAddress in orderNumber ' + orderNumber);
        }

        const customer = order.getCustomer().getProfile();
        const currencyCode = order.currencyCode;
        const token = tamaraHelper.generateToken(JSON.stringify({
            orderNo: orderNumber,
            paymentMethodID: paymentInstrument.getPaymentMethod()
        }));
        const items = [];
        const productLineItems = order.getProductLineItems();

        for (let i = 0; i < productLineItems.length; i++) {
            let lineItem = {
                "reference_id": productLineItems[i].productID,
                "type": productLineItems[i].categoryID || productLineItems[i].productName,
                "name": productLineItems[i].productName,
                "sku": productLineItems[i].getManufacturerSKU() || productLineItems[i].productID,
                "image_url": productLineItems[i].product.getImage('small', 0).getAbsURL().toString() || "",
                "quantity": productLineItems[i].quantityValue,
                "unit_price": {
                    "amount": productLineItems[i].basePrice.value,
                    "currency": currencyCode
                },
                "discount_amount": {
                    "amount": Number((productLineItems[i].basePrice.value * productLineItems[i].quantity.value - productLineItems[i].adjustedNetPrice.value).toFixed(2)),
                    "currency": currencyCode
                },
                "tax_amount": {
                    "amount": productLineItems[i].tax.value,
                    "currency": currencyCode
                },
                "total_amount": {
                    "amount": productLineItems[i].adjustedNetPrice.value,
                    "currency": currencyCode
                }
            };
            items.push(lineItem);
        }

        return {
            "order_reference_id": orderNumber,
            "total_amount": {
                "amount": order.totalGrossPrice.getValue(),
                "currency": currencyCode
            },
            "description": Resource.msgf(
                    'display.description.on.tamara',
                    'tamara',
                    null,
                    orderNumber,
                    order.totalGrossPrice,
                    request.getHttpHost() || ''
                ),
            "country_code": tamaraHelper.getCurrentCountryCode(), // 'US'
            "payment_type": tamaraHelper.getPaymentTypeID(paymentInstrument.getPaymentMethod()),
            "locale": request.getLocale(),
            "items": items,
            "consumer": {
                "first_name": customer ? customer.getFirstName() : billingAddress.getFirstName(),
                "last_name": customer ? customer.getLastName() : billingAddress.getLastName(),
                "phone_number": customer && customer.getPhoneMobile() ? customer.getPhoneMobile() : billingAddress.getPhone(),
                "email": order.customerEmail,
                //"national_id": "123456",
                "date_of_birth": customer ? customer.getBirthday() : "",
                //"is_first_order": true
            },
            "billing_address": {
                "first_name": billingAddress.getFirstName(),
                "last_name": billingAddress.getLastName(),
                "line1": billingAddress.getAddress1(),
                "line2": billingAddress.getAddress2(),
                "region": billingAddress.getStateCode(),
                "postal_code": billingAddress.getPostalCode(),
                "city": billingAddress.getCity(),
                "country_code": billingAddress.getCountryCode().getValue(),
                "phone_number": billingAddress.getPhone()
            },
            "shipping_address": {
                "first_name": shippingAddress.getFirstName(),
                "last_name": shippingAddress.getLastName(),
                "line1": shippingAddress.getAddress1(),
                "line2": shippingAddress.getAddress2(),
                "region": shippingAddress.getStateCode(),
                "postal_code": shippingAddress.getPostalCode(),
                "city": shippingAddress.getCity(),
                "country_code": shippingAddress.getCountryCode().getValue(),
                "phone_number": shippingAddress.getPhone()
            },
            // "discount": {
            //     "name": "Christmas 2020",
            //     "amount": {}
            // },
            "tax_amount": {
                "amount": order.getTotalTax().getValue(),
                "currency": currencyCode
            },
            "shipping_amount": {
                "amount": order.getShippingTotalPrice().getValue(),
                "currency": currencyCode
            },
            "merchant_url": {
                "success": URLUtils.https('Tamara-Success', 'token', token).toString(),
                "failure": URLUtils.https('Tamara-Failure', 'token', token).toString(),
                "cancel": URLUtils.https('Tamara-Cancel', 'token', token).toString(),
                "notification": URLUtils.https('Tamara-Notify', 'token', token).toString()
            },
            "platform": "SalesforceB2C",
            // "is_mobile": false,
            // "risk_assessment": {
            //     "has_cod_failed": true
            // }
        };
    },

    /**
     * Create Session for Tamara Checkout
     * @param {dw.order.Order} order - The current order's number
     * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
     * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
     * @return {Object} returns an object or throw an error message
     */
    initService: function(order, paymentInstrument, paymentProcessor){
        const service = tamaraHelper.getService(tamaraHelper.SERVICE.CHECKOUT.SESSION);
        if (!service) {
            throw new Error('Could not connect to ' + tamaraHelper.SERVICE.CHECKOUT.SESSION);
        }

        service.setRequestMethod('POST');
        const requestObject = tamaraServiceCheckout.initCheckoutSessionObject(order.getOrderNo(), paymentInstrument);
        const callResult = service.call(JSON.stringify(requestObject));

        if (!callResult.isOk()) {
            throw new Error(
                'Call error code ' + callResult.getError().toString()  + ' | Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText:  ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg()
            );
        }

        const authorized = callResult.object;
        if (!callResult.object) {
            throw new Error('No correct response from ' + tamaraHelper.SERVICE.CHECKOUT.PAYMENTTYPES);
        }

        Transaction.wrap(function () {
            order.custom.tamaraCheckoutURL = authorized.checkout_url;
            order.custom.tamaraOrderReferenceID = authorized.order_id;
            order.custom.tamaraNotification = requestObject.merchant_url.notification;
            order.custom.tamaraCancelNotification = requestObject.merchant_url.cancel;
            order.custom.tamaraFailureNotification = requestObject.merchant_url.failure;
            order.custom.tamaraSuccessNotification = requestObject.merchant_url.success;
            paymentInstrument.paymentTransaction.setTransactionID(order.getOrderNo());
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
        });

        return authorized;
    },

}

module.exports = tamaraServiceCheckout;