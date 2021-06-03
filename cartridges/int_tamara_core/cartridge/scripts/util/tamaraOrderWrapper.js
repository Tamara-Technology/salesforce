/**
 *The Order helper for Tamara Payment
 */
const tamaraHelper = require('*/cartridge/scripts/util/tamaraHelper');

/* eslint no-var: off */
var tamaraOrderWrapper = {

	/**
	 * Get the Tamara order information from custom attributes\
	 * @param {dw.order.Order} order - The current order's number
	 * @return object
	 */
	init: function(order){
		var orderConverted = {
			getOrderNo: function(){
				return '';
			},
			getOrderReferenceNo: function(){
				return '';
			},
			getStatus: function(){
				return '';
			},
			getPaymentType: function(){
				return '';
			},
			getCapturedAmount: function(){
				return 0;
			},
			getRefundedAmount: function(){
				return 0;
			},
			getCancelledAmount: function(){
				return 0;
			},
			getCapturedTransactions: function(){
				return [];
			},
			getRefundedTransactions: function(){
				return [];
			},
			getCancelledTransactions: function(){
				return [];
			},
			getCurrency: function(){
				return require('dw/util/Currency').getCurrency(order.getCurrencyCode()).getSymbol();
			},
			getTotalCaptured: function(){
				return '0 '+ this.getCurrency();
			},
			getTotalRefunded: function(){
				return '0 '+ this.getCurrency();
			},
			getTotalCancelled: function(){
				return '0 '+ this.getCurrency();
			},
			getAvailableActions: function(){
				return {
					'capture': 0,
					'refund': 0,
					'cancel': 0
				};
			},
		};
		if(order.custom.hasOwnProperty('tamaraOrderDetail') && order.getCustom()['tamaraOrderDetail']){
			try {
				const orderJSON = JSON.parse(order.getCustom()['tamaraOrderDetail']);
				orderConverted = {
					getOrderNo: function(){
						return orderJSON['order_reference_id'];
					},
					getOrderReferenceNo: function(){
						return orderJSON['order_id'];
					},
					getStatus: function(){
						return orderJSON['status'];
					},
					getPaymentType: function(){
						return orderJSON['payment_type'];
					},
					getCapturedAmount: function(){
						return orderJSON['captured_amount']['amount']*1;
					},
					getRefundedAmount: function(){
						return orderJSON['refunded_amount']['amount']*1;
					},
					getCancelledAmount: function(){
						return orderJSON['canceled_amount']['amount']*1;
					},
					getCapturedTransactions: function(){
						return orderJSON['transactions']['captures'];
					},
					getRefundedTransactions: function(){
						return orderJSON['transactions']['refunds'];
					},
					getCancelledTransactions: function(){
						return orderJSON['transactions']['cancels'];
					},
					getCurrency: function(){
						return require('dw/util/Currency').getCurrency(order.getCurrencyCode()).getSymbol();
					},
					getTotalCaptured: function(){
						return this.getCapturedAmount() + ' '+ this.getCurrency();
					},
					getTotalRefunded: function(){
						return this.getRefundedAmount() + ' '+ this.getCurrency();
					},
					getTotalCancelled: function(){
						return this.getCancelledAmount() + ' '+ this.getCurrency();
					},
					getAvailableActions: function(){
						let actions = {
							'capture': 0,
							'refund': 0,
							'cancel': 0
						};
						let remainingAmount = order.totalGrossPrice.getValue() - (this.getCancelledAmount() + this.getCapturedAmount());

						if(['approved', 'on_hold', 'declined', 'expired'].indexOf(this.getStatus()) === -1){
							actions.capture = remainingAmount;
							actions.cancel = remainingAmount;
							actions.refund = this.getCapturedAmount() - this.getRefundedAmount();
						}
						
						return actions;
					},
				};
			} catch (error) {
				tamaraHelper.getTamaraLogger().error(
					"Can not parse the JSON data in order {0}. Error: {1}",
					order.getOrderNo(),
					error.message
				);
			}
		}
		return orderConverted;
	},
};

module.exports = tamaraOrderWrapper;