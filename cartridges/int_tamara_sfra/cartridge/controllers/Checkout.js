'use strict';
var server = require('server');

var page = module.superModule;
server.extend(page);

/**
 * Checkout-Begin : The Checkout-Begin endpoint will render the checkout shipping page for both guest shopper and returning shopper
 */
server.prepend('Begin', function (req, res, next) { // eslint-disable-line

    const tamaraHelper = require('*/cartridge/scripts/util/tamaraHelper');
    let viewData = res.getViewData();

    if (tamaraHelper.getEnablementStatus()) {
        viewData.tamara = {
            isEnableInstalments: false,
            is6InstalmentsEnabled: false
        };
        try {
            const paymentTypes = tamaraHelper.getSupportedPayments();
            viewData.tamara = {
                isEnableInstalments: paymentTypes.isInstalmentValid,
                is6InstalmentsEnabled: paymentTypes.is6InstalmentValid
            };
        } catch (e) {
            tamaraHelper.getTamaraLogger().error(
                'Tamara: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber
            );
        }
    }

    next();
});

module.exports = server.exports();
