var bccWalletClientModule = angular.module('bccWalletClientModule', []);
var Client = require('../node_modules/bcccore-wallet-client');

bccWalletClientModule.constant('MODULE_VERSION', '1.0.0');

bccWalletClientModule.provider("bccWalletClient", function() {
  var provider = {};

  provider.$get = function() {
    var service = {};

    service.getCoreLib = function() {
      return Client.Bcccore;
    };

    service.getErrors = function() {
      return Client.errors;
    };

    service.getSJCL = function() {
      return Client.sjcl;
    };

    service.buildTx = Client.buildTx;
    service.parseSecret = Client.parseSecret;
    service.Client = Client;

    service.getUtils = function() {
      return Client.Utils;
    };

    service.getClient = function(walletData, opts) {
      opts = opts || {};

      var walletClient = new Client({
        baseUrl: opts.walletServiceUrl || 'https://bccws.openwalletstack.com/bccws/api',
        verbose: opts.verbose,
        timeout: 100000,
        transports: ['polling'],
      });
      if (walletData)
        walletClient.import(walletData, opts);
      return walletClient;
    };
    return service;
  };

  return provider;
});
