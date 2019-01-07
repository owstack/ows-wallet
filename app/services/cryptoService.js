'use strict';

angular.module('owsWalletApp.services').service('cryptoService', function(lodash, walletClient) {

  var root = {};

  var keyLib = [
    'HDPrivateKey',
    'HDPublicKey',
    'PrivateKey',
    'PublicKey'
  ];

  lodash.forEach(keyLib, function(k) {
    root[k] = walletClient.keyLib[k];
  });

  root.decrypt = walletClient.sjcl.decrypt;
  root.encrypt = walletClient.sjcl.encrypt;
  root.hexFromBits = walletClient.sjcl.codec.hex.fromBits;
  root.sha256Hash = walletClient.sjcl.hash.sha256.hash;

  return root;
});
