'use strict';

angular.module('owsWalletApp.controllers').controller('IndexCtrl', function($scope, $log, appConfigService) {
  $scope.appConfig = appConfigService;
  $log.info('Running index controller: ' + appConfigService.nameCase)
});
