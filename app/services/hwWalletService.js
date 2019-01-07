'use strict';

angular.module('owsWalletApp.services')
  .factory('hwWalletService', function($log, networkService) {
    var root = {};

    // Ledger magic number to get xPub without user confirmation
    root.ENTROPY_INDEX_PATH = "0xb11e/";
    root.M = 'm/';
    root.UNISIG_ROOTPATH = 44;
    root.MULTISIG_ROOTPATH = 48;
    root.LIVENET_PATH = 0;

    root._err = function(data) {
      var msg = data.error || data.message || 'unknown';
      return msg;
    };


    root.getRootPath = function(device, isMultisig, account) {
      var path;
      if (isMultisig) {
        path = root.MULTISIG_ROOTPATH;
      } else {
        if (device == 'ledger' && account > 0) {
          path = root.MULTISIG_ROOTPATH;
        } else {
          path = root.UNISIG_ROOTPATH;
        }
      }
      return path;
    };

    root.getAddressPath = function(device, isMultisig, account, networkName) {
      var networkPath = root.LIVENET_PATH;
      return root.getRootPath(device, isMultisig, account) + "'/" + networkPath + "'/" + account + "'";
    };

    root.getEntropyPath = function(device, isMultisig, account) {
      var path = root.ENTROPY_INDEX_PATH;
      if (isMultisig) {
        path = path + "48'/"
      } else {
        path = path + "44'/"
      }

      // Old ledger wallet compat
      if (device == 'ledger' && account == 0) {
        return path + "0'/";
      }

      return path + account + "'";
    };

    root.pubKeyToEntropySource = function(xPubKey, networkName) {
      var x = networkService.keyLib.HDPublicKey(xPubKey, networkName);
      return x.publicKey.toString();
    };

    return root;
  });
