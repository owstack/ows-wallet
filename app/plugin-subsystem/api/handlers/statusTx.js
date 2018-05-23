'use strict';

angular.module('owsWalletApp.pluginApi').service('statusTx', function($rootScope, lodash, profileService, networkService, Transaction) {

	var root = {};

  root.respond = function(message, callback) {
	  // Request parameters.
    var sessionId = message.request.header.sessionId;
    var walletId = message.request.params.id;
    var txguid = message.request.params.guid;
    var data = message.request.data;

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

		// Handle desired status change.
		if (data.status) {
			switch (data.status) {
				case 'approved':
					// Attempt to send the approved transaction.
					tx.send(function(err) {
						if (err) {

					    message.response = {
					      statusCode: 500,
					      statusText: 'STATUS_TX_ERROR',
					      data: {
					      	message: err
					      }
					    };
							return callback(message);

						}

					}, listener);
					break;

				case 'denied':
					// Delete the transaction from the wallet.
					lodash.remove(wallet.candidateTxps, function(tx) {
						return tx.guid == txguid;
					});

			    message.response = {
			      statusCode: 200,
			      statusText: 'OK',
			      data: {}
			    };
					return callback(message);
					break;
			}
		}
	};

  return root;
});
