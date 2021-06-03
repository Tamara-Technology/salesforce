/* eslint no-var: off */
var tamaraServicePaymentTypes = {

    /**
     * Get payment types for the checkout request
     * @return {Object} returns an object or throw an error message
     */
    initService: function () {
        var tamaraHelper = require('*/cartridge/scripts/util/tamaraHelper');

        const service = tamaraHelper.getService(tamaraHelper.SERVICE.CHECKOUT.PAYMENTTYPES);
        if (!service) {
            throw new Error('Could not connect to ' + tamaraHelper.SERVICE.CHECKOUT.PAYMENTTYPES);
        }

        service.setRequestMethod('GET');
        service.addParam('country', tamaraHelper.getCurrentCountryCode());
        const callResult = service.call();

        if (!callResult.isOk()) {
            throw new Error(
                'Call error code ' + callResult.getError().toString() + ' | Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText:  ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg()
            );
        }

        const resultObject = callResult.object;

        if (!resultObject) {
            throw new Error('No correct response from ' + tamaraHelper.SERVICE.CHECKOUT.PAYMENTTYPES);
        }

        return resultObject.toArray();
    },

}

module.exports = tamaraServicePaymentTypes;