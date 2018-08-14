'use strict';

angular.module('owsWalletApp.pluginApi').service('getWalletTransactions', function(lodash, profileService, walletService) {

  var root = {};

  var SAFE_HISTORY_PROPERTIES = [];

  root.respond = function(message, callback) {
    // Request parameters.
    var walletId = message.request.params.id;
    var txId = message.request.params.txId;

    if (lodash.isUndefined(walletId) || walletId.length <= 0) {
      message.response = {
        statusCode: 400,
        statusText: 'REQEUST_NOT_VALID',
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

    if (txId) {
      // Get a single transaction from the wallet.
      walletService.getTx(wallet, txId, function(error, tx) {
        if (error) {
          message.response = {
            statusCode: 500,
            statusText: 'UNEXPECTED_ERROR',
            data: {
              message: 'Could not get wallet transaction.'
            }
          };
          return callback(message);
        }

        message.response = {
          statusCode: 200,
          statusText: 'OK',
          data: tx
        };

        return callback(message);

      });

    } else {
      // Get wallet transaction history.
      walletService.getTxHistory(wallet, {}, function(error, txHistory) {
        if (error) {
          message.response = {
            statusCode: 500,
            statusText: 'UNEXPECTED_ERROR',
            data: {
              message: 'Could not get wallet transactions.'
            }
          };
          return callback(message);
        }

        message.response = {
          statusCode: 200,
          statusText: 'OK',
          data: txHistory
        };

        return callback(message);

      });
    };
  };

  return root;
});
