'use strict';

angular.module('owsWalletApp.pluginServices').factory('pluginSubsystem', function(pluginService, themeService) {
	var root = {};

  root.init = function(callback) {
    themeService.init().then(function() {
      return pluginService.init();

    }).then(function() {
        callback();

    }).catch(function(error) {
        $log.error('Could not initialize theme service: ' + error);

    });
  };

  root.finalize = function() {
    pluginService.finalize();
  };

  return root;
});
