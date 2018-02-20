'use strict';

angular.module('owsWalletApp.services').factory('appConfigService', function($window) {
  return $window.appConfig;
});
