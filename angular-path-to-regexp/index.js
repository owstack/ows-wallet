var pathToRegexpModule = angular.module('pathToRegexpModule', []);
var pathToRegexp = require('../node_modules/path-to-regexp');

pathToRegexpModule.constant('MODULE_VERSION', '1.0.0');

pathToRegexpModule.provider("pathToRegexpService", function() {
  var provider = {};

  provider.$get = function() {
    var service = {};

	  service.pathToRegexp = function(path, keys, options) {
	    return pathToRegexp(path, keys, options);
	  };

    return service;
	};

  return provider;
});
