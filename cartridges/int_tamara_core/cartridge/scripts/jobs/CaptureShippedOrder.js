'use strict';
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');
var Order = require('dw/order/Order');
const Resource = require('dw/web/Resource');
const tamaraOrderWrapper = require('*/cartridge/scripts/util/tamaraOrderWrapper');
const tamaraHelper = require('*/cartridge/scripts/util/tamaraHelper');
const tamaraServiceCapture = require('*/cartridge/scripts/services/tamaraServiceCapture');

/**
 * Attempts to place the order
 * @param {Object} args - The parameter of job {tamaraOrderStatus: string, limitOrderQuery: number}
 * @return {Object} Job status {ERROR, OK, WARN}
 */
function execute(args) {
  var tamaraStatus = args.tamaraOrderStatus.split('|').map(function (v) {
    return 'custom.tamaraPaymentStatus=\'' + v + '\'';
  }).join(' OR ');
  var limitOrderQuery = args.limitOrderQuery;
  var count = 0;

  var orderList = OrderMgr.searchOrders(
    '(' + tamaraStatus + ') AND (status={0} OR status={1}) AND shippingStatus={2} AND paymentStatus={3}',
    'creationDate desc',
    Order.ORDER_STATUS_OPEN,
    Order.ORDER_STATUS_NEW,
    Order.SHIPPING_STATUS_SHIPPED,
    Order.PAYMENT_STATUS_PAID
  );

  try {
    while (orderList.hasNext() && count < limitOrderQuery) {
      var order = orderList.next();
      const paymentInstruments = order.getPaymentInstruments().toArray().filter(function (instrument) {
        return [tamaraHelper.METHOD_TAMARA_INSTALMENTS, tamaraHelper.METHOD_TAMARA_6_INSTALMENTS].indexOf(instrument.paymentMethod) !== -1;
      });
      if (!paymentInstruments.length) {
        throw new Error(
          'TamaraHook-Listen: Not found paymentInstrument from orderNo ' + order.getOrderNo()
        );
      }
      var tamaraOrder = tamaraOrderWrapper.init(order);
      var requestObject = {
        "comment": "Captured by Salesforce B2C commerce Automation Job",
        "amount": tamaraOrder.getAvailableActions()['capture']
      };
      tamaraServiceCapture.initService(order, requestObject, 'CaptureShippedOrder-execute: ' + Resource.msgf('note.content.sfcc.capture', 'tamara', null, tamaraOrder.getAvailableActions()['capture'], order.currencyCode));
      count++;
    }
    return new Status(Status.OK, 'OK', 'Total Orders Processed: ' + count);
  } catch (e) {
    var message = 'Tamara: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber;
    tamaraHelper.getTamaraLogger().error(message);
    return new Status(Status.ERROR, 'ERROR', message);
  } finally {
    orderList.close();
  }
}

/*
 * Job exposed methods
 */
exports.execute = execute;