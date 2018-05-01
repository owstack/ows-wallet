'use strict';

angular.module('owsWalletApp.pluginServices').factory('pluginSubsystem', function(pluginService, themeService) {
	var root = {};

  root.init = function(callback) {
    themeService.init(function() {
      pluginService.init(function() {
        callback();
      });
    });
  };

  root.finalize = function() {
    pluginService.finalize();
  };

  return root;
});
