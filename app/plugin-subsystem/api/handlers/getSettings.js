'use strict';

angular.module('owsWalletApp.pluginApi').service('getSettings', function(lodash, configService, uxLanguageService) {

	var root = {};

  root.respond = function(message, callback) {

    var safeProperties = [
      'alternativeIsoCode',
      'alternativeName',
      'atomicUnitCode',
      'feeLevel',
      'unitCode',
      'unitDecimals',
      'unitName',
      'unitToAtomicUnit'
    ];

    var currencyNetworks = configService.getSync().currencyNetworks;
    var settings = {
      language: uxLanguageService.getCurrentLanguage(),
      defaultNetwork: currencyNetworks.default,
      networks: {}
    };

    Object.keys(currencyNetworks).forEach(function(cn) {
      if (cn == 'default') { // Not an applicable key
        return;
      }

      settings.networks[cn] = lodash.pickBy(currencyNetworks[cn], function(value, key) {
        return safeProperties.indexOf(key) >= 0;
      });
    });

    message.response = {
      statusCode: 200,
      statusText: 'OK',
      data: settings
    };

		return callback(message);
	};

  return root;
});
