"use strict";

function updateWidget() {
  const updateURL = $("#tamara-cart-widget").data("update-url");

  $.ajax({
    method: "get",
    url: updateURL,
    success: function (data) {
      if (data.widget) $("#tamara-cart-widget")[0].innerHTML = data.widget;
    },
  });
}

$(document).ready(function () {
  $("body").on("cart:update", function () {
    updateWidget();
  });

  $("body").on("promotion:success", function () {
    updateWidget();
  });

  $(".shippingMethods").change(function () {
    let timeInterval;
    if ($(".totals .veil").length) {
      timeInterval = setInterval(() => {
        if ($(".totals .veil").length === 0) {
          updateWidget();
          clearInterval(timeInterval);
        }
      }, 100);
    }
  });
});
