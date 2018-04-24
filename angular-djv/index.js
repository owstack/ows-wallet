var djvModule = angular.module('djvModule', []);
var djv = require('../node_modules/djv');

djvModule.constant('MODULE_VERSION', '1.0.0');

djvModule.provider("djv", function() {
  var provider = {};

  provider.$get = function() {
    var service = {};

    service.get = function() {
      return new djv();
    };
    return service;
  };

  return provider;
});
