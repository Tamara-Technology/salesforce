const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');

/* eslint no-var: off */
var tamaraServiceOrderDetail = {

    /**
     * Authorised the checkout request
     * @param {dw.order.Order} order - The current order's number
     * @param {boolean=} isTracked - enable this to track the API response to order data
     * @return {Object} returns an object or throw an error message
     */
    initService: function(order, isTracked){
        const tamaraHelper = require('*/cartridge/scripts/util/tamaraHelper');

        const service = tamaraHelper.getService(tamaraHelper.SERVICE.ORDER.DETAILED);
        if (!service) {
            throw new Error('Could not connect to ' + tamaraHelper.SERVICE.ORDER.DETAILED);
        }
        const url = service.getURL();
        service.setURL(url.replace("{orderReferenceId}", order.custom.tamaraOrderReferenceID));
        service.setRequestMethod('GET');
        const callResult = service.call();

        if (!callResult.isOk()) {
            throw new Error(
                'Call error code ' + callResult.getError().toString()  + ' | Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText:  ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg()
            );
        }

        var resultObject = callResult.object;

        if (!resultObject) {
            throw new Error('No correct response from ' + tamaraHelper.SERVICE.ORDER.DETAILED);
        }
        if(isTracked){
            const tamaraPaymentStatus = order.custom.tamaraPaymentStatus || '';
            Transaction.wrap(function () {
                order.custom.tamaraOrderDetail = JSON.stringify(resultObject);
                order.trackOrderChange(Resource.msg('note.content.sfcc.ordertracked', 'tamara', null));
                if (tamaraPaymentStatus != resultObject.status){
                    order.custom.tamaraPaymentStatus = resultObject.status;
                    order.trackOrderChange(Resource.msgf('note.content.sfcc.orderstatuschange', 'tamara', null, tamaraPaymentStatus, resultObject.status));
                }
            });
        }
        return resultObject;
    },

}

module.exports = tamaraServiceOrderDetail;