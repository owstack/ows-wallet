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

  return root;
});
