var walletClientModule = angular.module('walletClientModule', []);
var Client = require('../node_modules/@owstack/wallet-client');

walletClientModule.constant('MODULE_VERSION', '1.0.0');

walletClientModule.provider("walletClient", function() {
  var provider = {};

  provider.$get = function() {
    var service = {};

    service.availableCurrencies = Client.currencies;
    service.Credentials = Client.Credentials;
    service.errors = Client.errors;
    service.keyLib = Client.keyLib;
    service.sjcl = Client.sjcl;

    service.getInstance = function(opts) {
      opts = opts || {};

      if (!opts.currency || !opts.walletServiceUrl) {
        throw new Error('walletClient: you must specify a currency and walletServiceUrl');
      }

      var instance = new Client.currencies[opts.currency].API({
        baseUrl: opts.walletServiceUrl,
        timeout: 100000,
        logLevel: 'silent'
      });

      if (opts.credentials) {
        instance.import(opts.credentials);
      }
      return instance;
    };

    return service;
  };

  return provider;
});
