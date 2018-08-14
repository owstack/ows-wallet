'use strict';

angular.module('owsWalletApp.pluginApi').service('getWalletAddress', function(lodash, profileService, walletService) {

  var root = {};

  root.respond = function(message, callback) {
    // Request parameters.
    var walletId = message.request.params.id;

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

    walletService.getAddress(wallet, true, function(error, address) {
      if (error) {
        message.response = {
          statusCode: 500,
          statusText: 'UNEXPECTED_ERROR',
          data: {
            message: 'Could not get wallet address.'
          }
        };
        return callback(message);
      }

      message.response = {
        statusCode: 200,
        statusText: 'OK',
        data: address
      };

      return callback(message);

    });
  };

  return root;
});
