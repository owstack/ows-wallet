'use strict';

angular.module('owsWalletApp.pluginApi').service('getSettings', function(lodash, configService, uxLanguageService) {

	var root = {};

  root.respond = function(message, callback) {

    var safeProperties = [
      'alternativeIsoCode',
      'alternativeName',
      'feeLevel',
      'unitCode',
      'unitName'
    ];

    var networkPreferences = configService.getSync().networkPreferences;
    var settings = {
      language: uxLanguageService.getCurrentLanguage(),
      defaultNetworkName: networkPreferences.defaultNetworkName,
      networks: {}
    };

    Object.keys(networkPreferences).forEach(function(cn) {
      if (cn == 'default') { // Not an applicable key
        return;
      }

      settings.networks[cn] = lodash.pickBy(networkPreferences[cn], function(value, key) {
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
