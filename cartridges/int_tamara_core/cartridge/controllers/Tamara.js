'use strict';

/**
 * @namespace Tamara
 */

const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const tamaraHelper = require('*/cartridge/scripts/util/tamaraHelper');
const server = require('server');

function getTokenObject(req) {
    var token = req.querystring && req.querystring.token ? req.querystring.token : '';
    if (!token) {
        throw Error('Tamara-Success controller requires "token" in parameter, but not found in the request.');
    }

    var tokenObject = JSON.parse(tamaraHelper.decryptToken(token));
    if (!tokenObject || !tokenObject.orderNo || !tokenObject.paymentMethodID) {
        throw Error('Tamara-Success controller requires "orderNo" & "paymentMethodID" in token object, but not found in the request.' + tamaraHelper.decryptToken(token));
    }

    return tokenObject;
}

server.get('Success', server.middleware.https, function (req, res, next) {

    try {
        // Get response data from Tamara
        var responseObject = getTokenObject(req);

        const order = OrderMgr.getOrder(responseObject.orderNo);
        if (!order) {
            throw new Error(
                'Tamara-Success: Not found order object from orderNo ' + responseObject.orderNo
            );
        }

        const paymentInstrument = order.getPaymentInstruments(responseObject.paymentMethodID);
        if (!paymentInstrument.length) {
            throw new Error(
                'Tamara-Success: Not found paymentInstrument "' + responseObject.paymentMethodID + '" from orderNo ' + responseObject.orderNo
            );
        }

        tamaraHelper.placeOrder(req, order, paymentInstrument[0], 'Tamara-Success');

        res.redirect(URLUtils.url(
            'Order-Confirm',
            'ID',
            order.orderNo,
            'token',
            order.orderToken
        ));
        
    } catch (e) {
        tamaraHelper.getTamaraLogger().error(
            'Tamara: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber
        );
        res.redirect(URLUtils.url(
            'Checkout-Begin',
            'stage',
            'payment',
            'paymentError',
            Resource.msg('error.payment.not.valid', 'checkout', null)
        )
        );
    }

    return next();
});

//?orderID=00000001&paymentStatus=declined
server.get('Failure', server.middleware.https, function (req, res, next) {
    try {
        const responseObject = getTokenObject(req);

        const order = OrderMgr.getOrder(responseObject.orderNo);
        if (!order) {
            throw new Error(
                'Tamara-Failure: Not found order object from orderNo ' + responseObject.orderNo
            );
        }
        const paymentInstrument = order.getPaymentInstruments(responseObject.paymentMethodID);
        if (!paymentInstrument.length) {
            throw new Error(
                'Tamara-Failure: Not found paymentInstrument "' + responseObject.paymentMethodID + '" from orderNo ' + responseObject.orderNo
            );
        }
        tamaraHelper.failedOrder(order, paymentInstrument[0], 'Tamara-Failure');
    } catch (e) {
        tamaraHelper.getTamaraLogger().error(
            'Tamara: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber
        );
    }

    res.redirect(URLUtils.url(
        'Checkout-Begin',
        'stage',
        'payment',
        'paymentError',
        Resource.msg('error.payment.not.valid', 'checkout', null)
    )
    );
    next();
});

server.get('Cancel', server.middleware.https, function (req, res, next) {
    try {
        const responseObject = getTokenObject(req);

        const order = OrderMgr.getOrder(responseObject.orderNo);
        if (!order) {
            throw new Error(
                'Tamara-Cancel: Not found order object from orderNo ' + responseObject.orderNo
            );
        }
        const paymentInstrument = order.getPaymentInstruments(responseObject.paymentMethodID);
        if (!paymentInstrument.length) {
            throw new Error(
                'Tamara-Cancel: Not found paymentInstrument "' + responseObject.paymentMethodID + '" from orderNo ' + responseObject.orderNo
            );
        }
        tamaraHelper.cancelOrder(order, paymentInstrument[0], 'Tamara-Cancel');
    } catch (e) {
        tamaraHelper.getTamaraLogger().error(
            'Tamara: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber
        );
    }

    res.redirect(URLUtils.url(
        'Checkout-Begin',
        'stage',
        'payment',
        'paymentError',
        Resource.msg('error.payment.not.valid', 'checkout', null)
    )
    );
    next();
});

server.use('Notify', server.middleware.https, function (req, res, next) {
    try {

        // Get response data from Tamara
        var responseObject = getTokenObject(req);

        const order = OrderMgr.getOrder(responseObject.orderNo);
        const body = JSON.parse(req.body || '{}');
        if (!order || body.order_reference_id !== order.orderNo) {
            throw new Error(
                'Tamara-Notify: Not found related order object from orderNo ' + responseObject.orderNo
            );
        }

        const paymentInstrument = order.getPaymentInstruments(responseObject.paymentMethodID);
        if (!paymentInstrument.length) {
            throw new Error(
                'Tamara-Notify: Not found paymentInstrument "' + responseObject.paymentMethodID + '" from orderNo ' + responseObject.orderNo
            );
        }

        tamaraHelper.placeOrder(req, order, paymentInstrument[0], 'Tamara-Notify');
    } catch (e) {
        tamaraHelper.getTamaraLogger().error(
            'Tamara: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber
        );
        res.render(
            'tamara/tamaraFailure'
        );
    }
    res.render(
        'tamara/tamaraNotify'
    );
    next();
});

module.exports = server.exports();