const Resource = require('dw/web/Resource');
const tamaraHelper = require('*/cartridge/scripts/util/tamaraHelper');

/* eslint no-var: off */
var tamaraServiceCapture = {

    /**
     * Authorised the checkout request
     * @param {dw.order.Order} order - The current order's number
     * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
     * @param {Object} paymentInstrument -  The payment instrument to authorize
	 * @param {string} trackingChange - the system change message- for tracking purpose
     * @return {Object} returns an object or throw an error message
     */
    initService: function(order, paymentInstrument, trackingChange){

        const service = tamaraHelper.getService(tamaraHelper.SERVICE.ORDER.CANCEL);

        if (!service) {
            throw new Error('Could not connect to ' + tamaraHelper.SERVICE.ORDER.CANCEL);
        }

        const url = service.getURL();
        service.setURL(url.replace("{orderId}", order.custom.tamaraOrderReferenceID));
        service.setRequestMethod('POST');

        const callResult = service.call(JSON.stringify({
            "comment": "Captured by Salesforce B2C commerce platform",
            "total_amount": {
                "amount": order.totalGrossPrice.getValue(),
                "currency": order.currencyCode
            },
        }));

        if (!callResult.isOk()) {
            throw new Error(
                'Order No: ' +order.getOrderNo() + '. Call error code ' + callResult.getError().toString()  + ' | Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText:  ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg()
            );
        }

        var resultObject = callResult.object;
        if (!resultObject) {
            throw new Error('No correct response from ' + tamaraHelper.SERVICE.ORDER.CANCEL);
        }
        tamaraHelper.captureOrder(order, paymentInstrument, trackingChange);

        return resultObject;
    },

}

module.exports = tamaraServiceCapture;