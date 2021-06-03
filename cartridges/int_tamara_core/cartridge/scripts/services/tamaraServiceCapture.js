
/* eslint no-var: off */
var tamaraServiceCapture = {

    /**
     * Capture the checkout request
     * @param {dw.order.Order} order - The current order's number
     * @param {object} requestBody - The request object body {comment: '', amount: 0}
	 * @param {string} trackingChange - the system change message- for tracking purpose
     * @return {Object} returns an object or throw an error message
     */
    initService: function(order, requestBody, trackingChange){
        var tamaraHelper = require('*/cartridge/scripts/util/tamaraHelper');

        const service = tamaraHelper.getService(tamaraHelper.SERVICE.PAYMENT.CAPTURE);

        if (!service) {
            throw new Error('Could not connect to ' + tamaraHelper.SERVICE.PAYMENT.CAPTURE);
        }

        const url = service.getURL();
        service.setURL(url.replace("{orderId}", order.custom.tamaraOrderReferenceID));
        service.setRequestMethod('POST');

        const callResult = service.call(JSON.stringify({
            "comment": requestBody.comment,
            "total_amount": {
                "amount": requestBody.amount,
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
            throw new Error('No correct response from ' + tamaraHelper.SERVICE.PAYMENT.CAPTURE);
        }
        tamaraHelper.captureOrder(order, trackingChange);

        return resultObject;
    },

}

module.exports = tamaraServiceCapture;