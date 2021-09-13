/* global Ext jQuery */

var tamaraAdmin = (function ($) {
  var actionFormWindow;
  var transactionDetailWindow;
  var $window = $(window);

  function initTextareaCharectersLeft(parent) {
    parent = parent || document; // eslint-disable-line no-param-reassign
    $(parent).find('textarea[data-maxcount]').each(function () {
      var $textarea = $(this);
      var maxCount = $textarea.data('maxcount');
      var $countInput = $textarea.parent().find('.js_textarea_count');
      $countInput.text(maxCount);
      $textarea.on('keyup', function () {
        var text = $textarea.val();
        var left = maxCount - text.length;
        if (left >= 0) {
          $countInput.text(left);
        }
        $textarea.val(text.slice(0, maxCount));
      });
    });
  }

  function initEvents() {
    $('.js_tamara_show_detail').on('click', function () {
      var $button = $(this);
      transactionDetailWindow = new Ext.Window({
        title: $button.attr('title'),
        width: 780,
        height: 200,
        modal: true,
        autoScroll: true,
        cls: 'tamarabm_window_content'
      });
      transactionDetailWindow.show();
      transactionDetailWindow.maskOver = createMaskOver(transactionDetailWindow);
      loadOrderTransaction($button.data('orderno'));
      return false;
    });
  }

  function loadOrderTransaction(orderNo) {
    var data = {
      format: 'ajax',
      orderNo: orderNo || null
    };
    transactionDetailWindow.maskOver.show();
    $.ajax({
      url: tamaraAdmin.urls.orderTransaction,
      data: data,
      error: function () { // eslint-disable-line no-shadow
        transactionDetailWindow.maskOver.hide();
        if (transactionDetailWindow) {
          transactionDetailWindow.close();
        }
      },
      success: function (data) { // eslint-disable-line no-shadow
        transactionDetailWindow.maskOver.hide();
        if (transactionDetailWindow) {
          $('#' + transactionDetailWindow.body.id).html(data);
          transactionDetailWindow.setHeight('auto');
          transactionDetailWindow.center();
        } else {
          $('.js_tamarabm_content').html(data);
        }
        initOrderTransaction();
      }
    });
  }

  function recalculateModalWindowSize(el) {
    var modalWindow;
    if (typeof el === 'undefined') {
      $('.x-window').each(function () {
        recalculateModalWindowSize($(this).attr('id'));
      });
      return;
    }
    if (el.ctype === 'Ext.Component') {
      modalWindow = el;
    }
    if (el.jquery) {
      el = el.parents('.x-window').attr('id'); // eslint-disable-line no-param-reassign
    }
    if (typeof el === 'string') {
      modalWindow = Ext.getCmp(el);
    }
    var windowHeight = $window.height() - 30;
    modalWindow.setHeight('auto');
    var modalWindowHeight = modalWindow.getSize().height;
    if (modalWindowHeight > windowHeight) {
      modalWindow.setHeight(windowHeight);
    }
    modalWindow.center();
  }

  function createMaskOver(panel) {
    return (function () {
      return {
        ext: new Ext.LoadMask(panel.getEl()),
        show: function (type) {
          this.ext.msg = tamaraAdmin.resources.loadMaskText[type] || tamaraAdmin.resources.pleaseWait;
          this.ext.show();
        },
        hide: function () {
          this.ext.hide();
        }
      };
    }());
  }

  function initOrderTransaction() {
    tamaraAdmin.currentOrderNo = $('.js_tamarabm_order_detail').data('orderno');
    tamaraAdmin.currentCurrencyCode = $('.js_tamarabm_order_detail').data('currencycode');
    $('.js_tamara_action').on('click', function () {
      var $button = $(this);
      var action = $button.data('action');
      var $formContainer = $('#tamara_' + action + '_form');
      var formContainerClass = 'js_tamara_action_form_container_' + action;

      actionFormWindow = new Ext.Window({
        title: $button.data('title'),
        width: 700,
        modal: true,
        autoScroll: true,
        cls: 'tamarabm_window_content ' + formContainerClass,
        listeners: {
          render: function () {
            actionFormWindow.body.insertHtml('afterBegin', $formContainer.html());
            initTextareaCharectersLeft(actionFormWindow.body.dom);
            initActionFormEvents(actionFormWindow.body.dom, action);
          }
        },
        buttons: [
          {
            text: tamaraAdmin.resources.submit,
            handler: function () {
              submitActionForm($('.' + formContainerClass).find('form'), action);
            }
          },
          {
            text: tamaraAdmin.resources.cancel,
            handler: function () {
              actionFormWindow.close();
            }
          }
        ]
      });
      actionFormWindow.show();
      actionFormWindow.maskOver = createMaskOver(actionFormWindow);
    });
  }

  function submitActionForm($form, action) {
    if (isFormValid($form)) return false;

    actionFormWindow.maskOver.show(action);
    $.ajax({
      url: $form.attr('action'),
      data: $form.serialize(),
      dataType: 'json',
      error: function () {
        actionFormWindow.maskOver.hide();
        transactionDetailWindow.close();
        actionFormWindow.close();
      },
      success: function (data) {
        actionFormWindow.maskOver.hide();
        console.log(data);
        if (data.status === 'Success') {
          actionFormWindow.close();
          if (tamaraAdmin.currentOrderNo) {
            loadOrderTransaction(tamaraAdmin.currentOrderNo);
          } else {
            window.location.reload();
          }
        } else if (data.errorMessage) {
          showErrorMessage(data.errorMessage);
        } else {
          showErrorMessage(tamaraAdmin.resources.serverError);
        }
      }
    });
    return true;
  }

  function initActionFormEvents(parent, action) {
    $(parent).find('form').submit(function () {
      submitActionForm($(this), action);
      return false;
    });
  }

  function isFormValid($form) {
    var countErrors = 0;
    $form.find('.tamara_error_msg_box').hide();
    $form.find('.tamara_error_field').removeClass('tamara_error_field');
    $form.find('[data-validation]').not(':disabled').each(function () {
      var currentError = 0;
      var $field = $(this);
      var rules = $field.data('validation').replace(/\s/, '').split(',');
      var value = $.trim($field.val());
      $.each(rules, function (i, rule) {
        switch (rule) {
          case 'required':
            if (!value.length) {
              currentError++;
            }
            break;
          case 'float':
            if (isNaN(parseFloat(value)) || !isFinite(value)) {
              currentError++;
            }
            break;
          case 'greaterzero':
            if (parseFloat(value) <= 0) {
              currentError++;
            }
            break;
          default:
            break;
        }
        if (currentError) {
          var name = $field.data('general-validation') || $field.attr('name');
          $field.parents('tr').addClass('tamara_error_field');
          $form.find('.tamara_error_msg_box_' + name + '_' + rule).show();
          countErrors += currentError;
          recalculateModalWindowSize();
          return false;
        }
      });
    });
    return !!countErrors;
  }

  function showErrorMessage(text) {
    Ext.Msg.show({
      title: tamaraAdmin.resources.errorMsgTitle,
      msg: text,
      buttons: Ext.Msg.OK,
      icon: Ext.MessageBox.ERROR
    });
  }

  return {
    init: function (config) {
      $.extend(this, config);
      $(document).ready(function () {
        initEvents();
        if ($('.js_tamarabm_order_detail').size()) {
          initOrderTransaction();
        }
      });
    }
  };
}(jQuery));
