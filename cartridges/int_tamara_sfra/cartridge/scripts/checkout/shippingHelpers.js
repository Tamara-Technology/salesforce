"use strict";

var collections = require("*/cartridge/scripts/util/collections");
var ShippingMgr = require("dw/order/ShippingMgr");
var base = module.superModule;

/**
 * Returns the first applicable shipping method
 * @param {dw.util.Collection} methods - applicable shipping methods
 * @param {boolean} filterPickupInStore - exclude in-store pickup
 * @returns {dw.order.ShippingMethod|null} first applicable method
 */
function getFirstApplicableShippingMethod(methods, filterPickupInStore) {
  var method;
  var iterator = methods.iterator();

  while (iterator.hasNext()) {
    method = iterator.next();
    if (!filterPickupInStore || !method.custom.storePickupEnabled) {
      break;
    }
  }

  return method;
}

/**
 * Sets the shipping method with a null-safe fallback when no default is configured in BM
 * @param {dw.order.Shipment} shipment - target shipment
 * @param {string} shippingMethodID - selected shipping method ID
 * @param {dw.util.Collection} shippingMethods - applicable shipping methods
 * @param {Object} address - shipping address
 */
function selectShippingMethod(shipment, shippingMethodID, shippingMethods, address) {
  var applicableShippingMethods;
  var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
  var shippingAddress;
  var isShipmentSet = false;

  if (address && shipment) {
    shippingAddress = shipment.shippingAddress;

    if (shippingAddress) {
      if (address.stateCode && shippingAddress.stateCode !== address.stateCode) {
        shippingAddress.stateCode = address.stateCode;
      }
      if (address.postalCode && shippingAddress.postalCode !== address.postalCode) {
        shippingAddress.postalCode = address.postalCode;
      }
    }
  }

  if (shippingMethods) {
    applicableShippingMethods = shippingMethods;
  } else {
    var shipmentModel = ShippingMgr.getShipmentShippingModel(shipment);
    applicableShippingMethods = address
      ? shipmentModel.getApplicableShippingMethods(address)
      : shipmentModel.applicableShippingMethods;
  }

  if (shippingMethodID) {
    var iterator = applicableShippingMethods.iterator();

    while (iterator.hasNext()) {
      var shippingMethod = iterator.next();

      if (shippingMethod.ID === shippingMethodID) {
        shipment.setShippingMethod(shippingMethod);
        isShipmentSet = true;
        break;
      }
    }
  }

  if (!isShipmentSet) {
    if (
      defaultShippingMethod &&
      collections.find(applicableShippingMethods, function (sMethod) {
        return sMethod.ID === defaultShippingMethod.ID;
      })
    ) {
      shipment.setShippingMethod(defaultShippingMethod);
    } else if (applicableShippingMethods.length > 0) {
      shipment.setShippingMethod(
        getFirstApplicableShippingMethod(applicableShippingMethods, true)
      );
    } else {
      shipment.setShippingMethod(null);
    }
  }
}

module.exports = {
  getShippingModels: base.getShippingModels,
  selectShippingMethod: selectShippingMethod,
  ensureShipmentHasMethod: base.ensureShipmentHasMethod,
  getShipmentByUUID: base.getShipmentByUUID,
  getAddressFromRequest: base.getAddressFromRequest,
  getApplicableShippingMethods: base.getApplicableShippingMethods,
};
