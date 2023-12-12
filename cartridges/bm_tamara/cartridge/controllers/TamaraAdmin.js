'use strict';

/**
 * @namespace TamaraAdmin
 */

/* global dw request response empty */
const server = require('server');
const SystemObjectMgr = require('dw/object/SystemObjectMgr');
const PagingModel = require('dw/web/PagingModel');
const Resource = require('dw/web/Resource');
const OrderMgr = require('dw/order/OrderMgr');
const CSRFProtection = require('dw/web/CSRFProtection');
const tamaraHelper = require('*/cartridge/scripts/util/tamaraHelper');


/**
 * Get orders list. Can be filtered by order ID or transaction ID
 */
server.use('Orders', function (req, res, next) {
    try {
        var query = 'custom.tamaraPaymentStatus != NULL AND orderNo LIKE ';
        if (req.querystring.orderNo) {
            query += "'" + req.querystring.orderNo + "'";
        } else {
            query += "'*'";
        }

        if(req.querystring.transactionId){
            query += " And custom.tamaraOrderReferenceID LIKE '" + req.querystring.transactionId + "'";
        }

        var orders = SystemObjectMgr.querySystemObjects('Order', query, 'creationDate desc');
        var pageSize = !empty(request.httpParameterMap.pagesize.intValue) ? request.httpParameterMap.pagesize.intValue : 10;
        var currentPage = request.httpParameterMap.page.intValue ? request.httpParameterMap.page.intValue : 1;
        pageSize = pageSize === 0 ? orders.getCount() : pageSize;
        var start = pageSize * (currentPage - 1);
        var orderPagingModel = new PagingModel(orders, orders.getCount());

        orderPagingModel.setPageSize(pageSize);
        orderPagingModel.setStart(start);

        res.render('tamarabm/orderList', {
            PagingModel: orderPagingModel
        });
        
    } catch (e) {
        tamaraHelper.getTamaraBMLogger().error(
            'Tamara: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber
           );
        res.render('tamarabm/components/serverError', {});
    }
    

    next();
});

/**
 * Get order transaction details
 */
 server.use('OrderTransaction', function (req, res, next) {
    const tamaraOrderWrapper = require('*/cartridge/scripts/util/tamaraOrderWrapper');

    if (req.querystring.orderNo && !empty(req.querystring.orderNo)) {
        var order = OrderMgr.getOrder(req.querystring.orderNo.toString());
        res.render('tamarabm/orderDetail', {'order': order, 'tamaraOrder': tamaraOrderWrapper.init(order)});
    } else {
        res.render('tamarabm/components/serverError', {});
        return;
    }
    next();
});

/**
 * Do some action, like DoAuthorize, DoCapture, DoRefund and etc
 */
 server.use('Action', function (req, res, next) {
    var params = req.querystring;
    var responseResult = {
        result: null,
        status: 'Success',
        errorMessage: ''
    };

    if (!CSRFProtection.validateRequest()) {
        responseResult = {
            result: null,
            status: 'Error',
            errorMessage: 'CSRF token mismatch'
        };
        res.json(responseResult);
        return next();
    }

    if (!params.methodName || ['DoCapture', 'DoVoid', 'DoRefund'].indexOf(params.methodName.toString()) === -1) {
        responseResult = {
            result: null,
            status: 'Error',
            errorMessage: 'methodName: "' +params.methodName+ '" is not supported.'
        };
        res.json(responseResult);
        return next();
    }

    var order = OrderMgr.getOrder(params.orderNo.toString());

    if (!order) {
        responseResult = {
            result: null,
            status: 'Error',
            errorMessage: 'Not found relevant Order.'
        };
        res.json(responseResult);
        return next();
    }
    try {
        var requestObject = {
            "comment": params.note,
            "amount": params.amt
        };
    
        switch (params.methodName.toString()) {
            case 'DoCapture':    
                const tamaraServiceCapture = require('*/cartridge/scripts/services/tamaraServiceCapture');
                responseResult.result = tamaraServiceCapture.initService(order, requestObject, 'TamaraAdmin-Action: ' + Resource.msgf('note.content.sfcc.merchantcapture', 'tamarabm', null, params.amt, order.currencyCode));
            break;
            case 'DoVoid':
                const tamaraServiceCancel = require('*/cartridge/scripts/services/tamaraServiceCancel');
                responseResult.result = tamaraServiceCancel.initService(order, requestObject, 'TamaraAdmin-Action: ' + Resource.msgf('note.content.sfcc.merchantcancel', 'tamarabm', null, params.amt, order.currencyCode));
            break;
            case 'DoRefund':
                const tamaraServiceRefund = require('*/cartridge/scripts/services/tamaraServiceRefund');
                responseResult.result = tamaraServiceRefund.initService(order, requestObject, 'TamaraAdmin-Action: ' + Resource.msgf('note.content.sfcc.merchantrefund', 'tamarabm', null, params.amt, order.currencyCode));
            break;
            default:
                responseResult = {
                    result: null,
                status: 'Error',
                errorMessage: 'methodName: "' +params.methodName+ '" is not supported.'
                };
            break;
        }
    } catch (e) {
        const tamaraServiceOrderDetail = require('*/cartridge/scripts/services/tamaraServiceOrderDetail');
        tamaraServiceOrderDetail.initService(order, true);
        responseResult = {
            result: null,
            status: 'Error',
            errorMessage: e.toString()
        };
        tamaraHelper.getTamaraBMLogger().error(
            'Tamara: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber
           );
    }
    
    res.json(responseResult);
    next();
});

module.exports = server.exports();