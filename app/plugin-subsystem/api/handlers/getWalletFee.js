'use strict';

angular.module('owsWalletApp.pluginApi').service('getWalletFee', function(lodash, profileService, walletService) {

  var root = {};

  root.respond = function(message, callback) {
    // Request parameters.
    var walletId = message.request.params.id;
    var feeLevel = message.request.params.level;

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

    feeLevel = feeLevel || root.getCurrentFeeLevel(wallet.network);

    feeService.getFeeRate(feeLevel, wallet, function(error, feePerKb) {
      if (error) {
        message.response = {
          statusCode: 500,
          statusText: 'UNEXPECTED_ERROR',
          data: {
            message: 'Could not get wallet fee.'
          }
        };
        return callback(message);
      }

      message.response = {
        statusCode: 200,
        statusText: 'OK',
        data: feePerKb
      };

      return callback(message);

    });
  };

  return root;
});
