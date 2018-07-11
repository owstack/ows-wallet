'use strict';

angular.module('owsWalletApp.pluginApi').service('createTx', function($rootScope, lodash, profileService, configService, networkService, pluginSessionService, Transaction) {

	var root = {};
	var config = configService.getSync();

  root.respond = function(message, callback) {
	  // Request parameters.
    var sessionId = message.header.sessionId;
    var walletId = message.request.data.walletId;
    var urlOrAddress = message.request.data.urlOrAddress;
    var amount = message.request.data.amount;
    var useSendMax = message.request.data.useSendMax || false;
    var fee = message.request.data.fee;
    var description = message.request.data.description;

  	if (lodash.isUndefined(sessionId) || sessionId.length <= 0) {
	    message.response = {
	      statusCode: 400,
	      statusText: 'REQUEST_NOT_VALID',
	      data: {
	      	message: 'The request must include a session id.'
	      }
	    };
			return callback(message);
  	}

		// Get the session.
		var session = pluginSessionService.getSession(sessionId);

		if (lodash.isUndefined(session)) {
	    message.response = {
	      statusCode: 404,
	      statusText: 'SESSION_NOT_FOUND',
	      data: {
	      	message: 'Session not found.'
	      }
	    };
			return callback(message);
		}

  	if (lodash.isUndefined(walletId) || walletId.length <= 0) {
	    message.response = {
	      statusCode: 400,
	      statusText: 'REQUEST_NOT_VALID',
	      data: {
	      	message: 'The request must include a wallet id.'
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

		// Now that we have the wallet, update the fee information.
		if (fee) {
	    fee = {
				level: fee.level || config.currencyNetworks[wallet.networkURI].feeLevel,
				rate: fee.rate,
				useCustomFee: fee.useCustomFee
	    };
		} else {
	    fee = {
				level: config.currencyNetworks[wallet.networkURI].feeLevel,
				rate: undefined,
				useCustomFee: false
	    };
		}

		networkService.tryResolve(urlOrAddress, function(resolved) {
			if (resolved.match) {

				// If resolved to paypro and the paypro network URI does not match the selected wallet then
				// there is something wrong.
				if (resolved.paypro && (resolved.paypro.networkURI != wallet.networkURI)) {
				    message.response = {
			      statusCode: 400,
			      statusText: 'INCOMPATABLE_WALLET',
			      data: {
			      	message: 'Wallet not compatible with payment data.',
			      	paymentDataURI: resolved.paypro.networkURI,
			      	walletURI: wallet.networkURI
			      }
			    };
					return callback(message);
				}

				// Resolved amount may come from paypro details. If available, choose paypro amount info over message post data amount.
				resolved.amount = resolved.amount || amount;

		    // Set the transaction data.
		    var txData = {
		      // Core properties.
		      toAddress: resolved.address,
		      toAmount: parseInt(resolved.amount),
		      useSendMax: useSendMax == 'true' ? true : false,
		      paypro: resolved.paypro,
		      feeLevel: config.currencyNetworks[wallet.networkURI].feeLevel,
		      networkURI: wallet.networkURI,

		      // Additional properties.
		      description: description || resolved.paypro.memo,
		      spendUnconfirmed: config.wallet.spendUnconfirmed,
		      feeLevel: fee.level,
		      feeRate: fee.rate,
		      useCustomFee: fee.useCustomFee
		    };

		    // Create the transaction.
		    var tx = new Transaction(txData);

		    // Apply the wallet to the transaction.
		    tx.setWallet(wallet, function(err) {

		    	if (err) {
				    message.response = {
				      statusCode: 500,
				      statusText: 'TX_CREATE_ERROR',
				      data: {
				      	message: err
				      }
				    };
						return callback(message);
		    	}

	        // Successfully created a transaction.
	        // Have the session hold on to the candidate transaction.
	        session.candidateTxps.push(tx);

			    message.response = {
			      statusCode: 200,
			      statusText: 'OK',
			      data: {
			      	tx: tx,
			      	shouldConfirm: tx.shouldConfirm()
			      }
			    };
					return callback(message);

		    });

			} else {

		    message.response = {
		      statusCode: 400,
		      statusText: 'INVALID_PAYMENT_DATA',
		      data: {
		      	message: 'Could not resolve payment information.'
		      }
		    };
				return callback(message);

			}
		});
	};

  return root;
});
