'use strict';

/**
 * @namespace TamaraTest
 */

const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const tamaraHelper = require('*/cartridge/scripts/util/tamaraHelper');
const tamaraServiceCheckout = require('*/cartridge/scripts/services/tamaraServiceCheckout');
const tamaraServiceAuthorised = require('*/cartridge/scripts/services/tamaraServiceAuthorised');
const server = require('server');

// Create Tamara Checkout Session #https://docs.tamara.co/#tag/Checkout
server.get('CreateSession', function (req, res, next) {
    var orderNumber = req.querystring && req.querystring.orderNo ? req.querystring.orderNo.toString() : '';
    if(!orderNumber){
        throw new Error(
            'Missing orderNo in query parameter!'
        );
    }

    const order = OrderMgr.getOrder(orderNumber);
    if(!order){
        throw new Error(
            'Not found order object from orderNo ' + orderNumber
        );
    }
    var requestObject = null;
    var resultObject = null;

    try {
        var paymentInstrument = order.getPaymentInstruments().toArray()[0];
        tamaraServiceCheckout.initService(order, paymentInstrument);
    } catch (e) {
        var a = e;
        tamaraHelper.getTamaraLogger().error(
         'Tamara: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber
        );
    }
    res.render(
        'tamara/test/tamaraCreateSession',
        {
            requestObject: requestObject,
            resultObject: resultObject
        }
    );
    next();
});

// Authorised Tamara Order #https://docs.tamara.co/#tag/Order/paths/~1orders~1{orderId}~1authorise/post
server.get('Authorised', function (req, res, next) {
    var orderNumber = req.querystring && req.querystring.orderNo ? req.querystring.orderNo.toString() : '';
    if(!orderNumber){
        throw new Error(
            'Missing orderNo in query parameter!'
        );
    }

    const order = OrderMgr.getOrder(orderNumber);
    if(!order || !order.custom.tamaraOrderReferenceID){
        throw new Error(
            'Not found order object or tamara reference order ID from orderNo ' + orderNumber
        );
    }
    var resultObject = null;

    try {
        var paymentInstrument = order.getPaymentInstruments().toArray()[0];
        resultObject = tamaraServiceAuthorised.initService(order, paymentInstrument);
    } catch (e) {
        var a = e;
        tamaraHelper.getTamaraLogger().error(
         'Tamara: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber
        );
    }
    res.render(
        'tamara/test/tamaraAuthorised',
        {
            resultObject: resultObject
        }
    );
    next();
});

module.exports = server.exports();