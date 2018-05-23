'use strict';

angular.module('owsWalletApp.pluginApi').service('chooseWallet', function($rootScope, lodash, pluginSessionService) {

	var root = {};

	var SAFE_WALLET_PROPERTIES = [
		'id',
		'network',
		'currency',
		'm',
		'n',
		'name',
		'needsBackup',
		'balanceHidden',
		'keyDerivationOk',
		'error',
		'isValid',
		'cachedBalance',
		'cachedBalanceUpdatedOn',
		'cachedActivity',
		'status.wallet.version',
		'status.wallet.createdOn',
		'status.wallet.singleAddress',
		'status.wallet.status',
		'status.wallet.copayers',
		'status.wallet.derivationStrategy',
		'status.wallet.addressType',
		'status.pendingTxps',
		'status.statusUpdatedOn',
		'status.isValid',
		'status.balanceByAddress',
		'status.totalBalanceAtomic',
		'status.lockedBalanceAtomic',
		'status.availableBalanceAtomic',
		'status.pendingAmount',
		'status.spendableAmount',
		'status.unitToAtomicUnit',
		'status.atomicToUnit',
		'status.unitName',
		'status.totalBalanceValueStr',
		'status.totalBalanceUnitStr',
		'status.totalBalanceStr',
		'status.lockedBalanceValueStr',
		'status.lockedBalanceUnitStr',
		'status.lockedBalanceStr',
		'status.availableBalanceValueStr',
		'status.availableBalanceUnitStr',
		'status.availableBalanceStr',
		'status.spendableBalanceValueStr',
		'status.spendableBalanceUnitStr',
		'status.spendableBalanceStr',
		'status.pendingBalanceValueStr',
		'status.pendingBalanceUnitStr',
		'status.pendingBalanceStr',
		'status.alternativeName',
		'status.alternativeIsoCode',
		'status.totalBalanceAlternative',
		'status.pendingBalanceAlternative',
		'status.lockedBalanceAlternative',
		'status.spendableBalanceAlternative',
		'status.alternativeConversionRate',
		'status.alternativeBalanceAvailable',
		'status.isRateAvailable'
	];

  root.respond = function(message, callback) {
	  // Request parameters.
    var sessionId = message.request.params.id;

  	if (lodash.isUndefined(sessionId) || sessionId.length <= 0) {
	    message.response = {
	      statusCode: 400,
	      statusText: 'REQEUST_NOT_VALID',
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
	      statusText: 'SESSION_NOT_FOUND.',
	      data: {
	      	message: 'Session not found.'
	      }
	    };
			return callback(message);
		}

		$rootScope.$emit('Local/ChooseWalletForApplet');

		// Place listener here so we have scope for the message. However, it's important to cancel
		// this listener on each receive so we don't accumulate.
		var cancelWalletForAppletListener = $rootScope.$on('Local/WalletForApplet', function(event, wallet) {
			cancelWalletForAppletListener();

			var walletObj = {};

			// No wallet object if user canceled.
			if (wallet) {
				walletObj = lodash.pick(wallet, SAFE_WALLET_PROPERTIES);

		    message.response = {
		      statusCode: 200,
		      statusText: 'OK',
		      data: walletObj
		    };
			} else {
		    message.response = {
		      statusCode: 204,
		      statusText: 'USER_CANCELED',
		      data: {
		      	message: 'User canceled operation.'
		      }
		    };
			}

			return callback(message);
		});

	};

  return root;
});
