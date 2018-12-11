var walletClientModule = angular.module('walletClientModule', []);
var Client = require('../node_modules/@owstack/wallet-client');

walletClientModule.constant('MODULE_VERSION', '1.0.0');

walletClientModule.provider("walletClient", function() {
  var provider = {};

  provider.$get = function() {
    var service = {};

    service.Client = Client;

    service.credentialsLib = function() {
      return Client.credentialsLib;
    };

    service.keyLib = function() {
      return Client.keyLib;
    };

    service.getErrors = function() {
      return Client.errors;
    };

    return service;
  };

  return provider;
});
