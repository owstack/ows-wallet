'use strict';

angular.module('owsWalletApp.pluginApi').service('getWallets', function($rootScope, lodash, pluginSessionService, profileService, utilService) {

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
		'cachedActivity.createdOn',
		'cachedActivity.creatorName',
		'cachedActivity.data.amount',
		'cachedActivity.data.message',
		'cachedActivity.data.txid',
		'cachedActivity.type',
		'color',
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
    var walletId = message.request.data.walletId;
    var filter = message.request.data.filter;
    var picker = message.request.data.picker;
    var title = message.request.data.title;

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
	      statusText: 'SESSION_NOT_FOUND',
	      data: {
	      	message: 'Session not found.'
	      }
	    };
			return callback(message);
		}

		if (picker) {
			chooseWallet(filter, picker, title, message, callback);

		} else if (walletId) {

	    message.response = {
	      statusCode: 200,
	      statusText: 'OK',
	      data: getWallet(walletId)
	    };

			return callback(message);

		} else {

	    message.response = {
	      statusCode: 200,
	      statusText: 'OK',
	      data: getWallets(filter)
	    };

			return callback(message);
		}
	};

	function chooseWallet(filter, picker, title, message, callback) {
		$rootScope.$emit('Local/ChooseWalletForApplet', {
			filter: filter,
			picker: picker,
			title: title
		});

		// Listen for the users repsonse to the picker.
		var cancelWalletForAppletListener = $rootScope.$on('Local/WalletForApplet', function(event, wallet) {
			cancelWalletForAppletListener();

			var walletObj = {};

			if (lodash.isNull(wallet)) {
				// Null value - user canceled operation.
		    message.response = {
		      statusCode: 204,
		      statusText: 'USER_CANCELED',
		      data: {
		      	message: 'User canceled operation.'
		      }
		    };

			} else if (lodash.isUndefined(wallet)) {
				// Undefined value - No wallets available to select.
		    message.response = {
		      statusCode: 404,
		      statusText: 'WALLET_NOT_FOUND',
		      data: {
		      	message: 'No wallets available for selection.'
		      }
		    };

			} else {
				walletObj = utilService.pick(wallet, SAFE_WALLET_PROPERTIES);

		    message.response = {
		      statusCode: 200,
		      statusText: 'OK',
		      data: walletObj
		    };
			}

			return callback(message);
		});
	};

	function getWallet(walletId) {
		var wallet = profileService.getWallet(walletId);
		return utilService.pick(wallet, SAFE_WALLET_PROPERTIES);
	};

	function getWallets(filter) {
		var wallets = profileService.getWallets();
		var filteredWallets = wallets;
		var safeWallets = [];

		var currencies = lodash.get(filter, 'currencies');
		if (currencies && currencies.length > 0) {
			filteredWallets = lodash.filter(wallets, function(w) {
				return filter.currencies.includes(w.currency.toUpperCase());
			});
		}

		lodash.forEach(filteredWallets, function(w) {
			safeWallets.push(utilService.pick(w, SAFE_WALLET_PROPERTIES));
		});

		return safeWallets;
	};

  return root;
});
