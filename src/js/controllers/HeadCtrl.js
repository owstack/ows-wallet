'use strict';

angular.module('owsWalletApp.controllers').controller('HeadCtrl', function($scope, appConfigService, $log) {
  $scope.appConfig = appConfigService;
  $log.info('Running head controller:' + appConfigService.nameCase)
});
