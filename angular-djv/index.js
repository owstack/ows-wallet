var djvModule = angular.module('djvModule', []);

djvModule.constant('MODULE_VERSION', '1.0.0');

// 'djv' is a global provided by node_modules/djv/djv.js
djvModule.provider('djv', function() {
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
