var bchWalletClientModule = angular.module('bchWalletClientModule', []);
var Client = require('../node_modules/bch-wallet-client');

bchWalletClientModule.constant('MODULE_VERSION', '1.0.0');

bchWalletClientModule.provider("bchWalletClient", function() {
  var provider = {};

  provider.$get = function() {
    var service = {};

    service.getLib = function() {
      return Client.bchLib;
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

      if (!opts.walletServiceUrl) {
        throw new Error('bchWalletClient: you must specify a walletServiceUrl');
      }

      var walletClient = new Client({
        baseUrl: opts.walletServiceUrl,
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
