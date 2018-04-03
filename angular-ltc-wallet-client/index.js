var ltcWalletClientModule = angular.module('ltcWalletClientModule', []);
var Client = require('../node_modules/@owstack/ltc-wallet-client');

ltcWalletClientModule.constant('MODULE_VERSION', '1.0.0');

ltcWalletClientModule.provider("ltcWalletClient", function() {
  var provider = {};

  provider.$get = function() {
    var service = {};

    service.getLib = function() {
      return Client.ltcLib;
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
        throw new Error('ltcWalletClient: you must specify a walletServiceUrl');
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
