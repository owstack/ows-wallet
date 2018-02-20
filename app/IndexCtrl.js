'use strict';

angular.module('owsWalletApp.controllers').controller('IndexCtrl', function($scope, appConfigService, $log) {
  $scope.appConfig = appConfigService;
  $log.info('Running head controller:' + appConfigService.nameCase)
});
