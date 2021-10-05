'use strict';

/**
 * @namespace TamaraHook
 */
const OrderMgr = require('dw/order/OrderMgr');
const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const tamaraHelper = require('*/cartridge/scripts/util/tamaraHelper');
const server = require('server');

server.use('Listen', server.middleware.https, function (req, res, next) {
    try {
        const body = JSON.parse(req.body || '{}');
        const order = OrderMgr.getOrder(body.order_reference_id);
        if(!order){
            throw new Error(
                'TamaraHook-Listen: Not found order object from orderNo ' + body.order_reference_id
            );
        }
        const paymentInstruments = order.getPaymentInstruments().toArray().filter(function (instrument) {
            return [tamaraHelper.METHOD_TAMARA_PAYLATER, tamaraHelper.METHOD_TAMARA_INSTALMENTS, tamaraHelper.METHOD_TAMARA_6_INSTALMENTS].indexOf(instrument.paymentMethod) !== -1;
        });
        if(!paymentInstruments.length){
            throw new Error(
                'TamaraHook-Listen: Not found paymentInstrument from orderNo ' + body.order_reference_id
            );
        }

        switch (body.event_type) {
            case 'order_approved':
                tamaraHelper.placeOrder(req, order, paymentInstruments[0], 'TamaraHook-Listen');
                break;
            case 'order_on_hold':
                break;
            case 'order_declined':
                tamaraHelper.failedOrder(order, paymentInstruments[0], 'TamaraHook-Listen');
                break;
            case 'order_authorised':
                tamaraHelper.placeOrder(req, order, paymentInstruments[0], 'TamaraHook-Listen');
                break;
            case 'order_canceled':
                tamaraHelper.cancelOrder(order, paymentInstruments[0], 'TamaraHook-Listen');
                break;
            case 'order_captured':
                tamaraHelper.captureOrder(order, 'TamaraHook-Listen: ' + Resource.msg('note.content.tamara.capture', 'tamara', null));
                break;
            case 'order_refunded':
                tamaraHelper.refundOrder(order, 'TamaraHook-Listen: ' + Resource.msg('note.content.tamara.refund', 'tamara', null));
                break;
            case 'order_expired':
                tamaraHelper.failedOrder(order, paymentInstruments[0], 'TamaraHook-Listen');
                break;
            default:
                    throw new Error('Cannot render template without name or data');
        }
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
// f67d497d-1d05-4b61-8cfe-fac9e5d96a3b
server.get('Register', server.middleware.https, function (req, res, next) {
    var resultObject = null;
    try {
        const service = tamaraHelper.getService(tamaraHelper.SERVICE.WEBHOOK.REGISTER);
        if (!service) {
            throw new Error('Could not connect to ' + tamaraHelper.SERVICE.WEBHOOK.REGISTER);
        }
        service.setRequestMethod('POST');
        var requestObject = {
            "url": URLUtils.https('TamaraHook-Listen').toString(),
            "events": JSON.parse(tamaraHelper.getWebhookEvents())
        };
        const callResult = service.call(JSON.stringify(requestObject));

        if (!callResult.isOk()) {
            throw new Error(
                'Call error code ' + callResult.getError().toString()  + ' | Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText:  ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg()
            );
        }

        resultObject = callResult.object;

        if (!resultObject) {
            throw new Error('No correct response from ' + tamaraHelper.SERVICE.ORDER.AUTHORISED);
        }
    } catch (e) {
        tamaraHelper.getTamaraLogger().error(
         'Tamara: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber
        );
    }
    res.render(
        'tamara/tamaraRegisterWebHook',
        {
            resultObject: resultObject
        }
    );
    next();
});

module.exports = server.exports();