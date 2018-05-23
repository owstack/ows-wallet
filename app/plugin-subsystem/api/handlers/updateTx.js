'use strict';

angular.module('owsWalletApp.pluginApi').service('updateTx', function($rootScope, lodash, profileService, networkService, Transaction) {

	var root = {};

  root.respond = function(message, callback) {
	  // Request parameters.
	  var sessionId = message.header.sessionId;
    var txguid = message.request.params.guid;
    var walletId = message.request.params.id;
    var data = message.request.data;

  	if (lodash.isUndefined(sessionId) || sessionId.length <= 0) {
	    message.response = {
	      statusCode: 404,
	      statusText: 'SESSION_NOT_FOUND',
	      data: {
	      	message: 'Session not found.'
	      }
	    };
			return callback(message);
  	}

  	if ((lodash.isUndefined(walletId) || walletId.length <= 0) ||
  		(lodash.isUndefined(txguid) || txguid.length <= 0)) {
	    message.response = {
	      statusCode: 400,
	      statusText: 'REQUEST_NOT_VALID',
	      data: {
	      	message: 'The request must include a wallet id and transaction guid.'
	      }
	    };
			return callback(message);
  	}

		// Get the wallet.
		var wallet = profileService.getWallet(walletId);

		if (lodash.isUndefined(wallet)) {
	    message.response = {
	      statusCode: 404,
	      statusText: 'WALLET_NOT_FOUND',
	      data: {
	      	message: 'Wallet not found.'
	      }
	    };
			return callback(message);
		}

		// Get the transaction.
		var tx = lodash.find(session.candidateTxps, function(tx) {
			return tx.guid == txguid;
		});

		if (lodash.isUndefined(tx)) {
	    message.response = {
	      statusCode: 404,
	      statusText: 'TX_NOT_FOUND',
	      data: {
	      	message: 'Transaction not found.'
	      }
	    };
			return callback(message);
		}

		// Update the wallet for the transaction.
		if (data.walletId) {

			// Get the new wallet.
			var newWallet = profileService.getWallet(data.walletId);

			if (lodash.isUndefined(newWallet)) {
		    message.response = {
		      statusCode: 404,
		      statusText: 'TX_UPDATE_ERROR',
		      data: {
		      	message: 'Destination wallet not found.'
		      }
		    };
				return callback(message);
			}

			tx.setWallet(newWallet, function(err) {
				if (err) {
			    message.response = {
			      statusCode: 500,
			      statusText: 'TX_UPDATE_ERROR',
			      data: {
			      	message: err
			      }
			    };
					return callback(message);
				}
			});

		// Update the transaction fee information.
		} else if (data.fee) {
			var fee = data.fee;

			if (!fee.level || !fee.rate || !fee.isCustomRate) {
		    message.response = {
		      statusCode: 400,
		      statusText: 'TX_UPDATE_ERROR',
		      data: {
		      	message: 'Missing fee information.'
		      }
		    };
				return callback(message);
			}

			tx.setFee(fee.level, fee.rate, fee.isCustomRate, function(err) {
				if (err) {
			    message.response = {
			      statusCode: 500,
			      statusText: 'TX_UPDATE_ERROR',
			      data: {
			      	message: err
			      }
			    };
					return callback(message);
				}
			});			

		}

	};

  return root;
});
