"use strict";
var server = require("server");

var page = module.superModule;
server.extend(page);

server.get("TamaraWidget", function (req, res, next) {
  var BasketMgr = require("dw/order/BasketMgr");
  var currentBasket = BasketMgr.getCurrentBasket();
  const tamaraHelper = require("*/cartridge/scripts/util/tamaraHelper");

  const widget = tamaraHelper.getProductWidget({
    sales: {
      decimalPrice: currentBasket.totalGrossPrice.decimalValue,
    },
  });

  res.json({ widget: widget });
  next();
});

module.exports = server.exports();
