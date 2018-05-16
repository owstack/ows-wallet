'use strict';

angular.module('owsWalletApp.pluginApi').service('apiService', function(ApiMessage) {

	var root = {};

  root.init = function() {
    return new Promise(function(resolve, reject) {
      // ApiMessage is injected to load.
      resolve();
    });
  };

  return root;
});
