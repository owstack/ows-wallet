'use strict';

angular.module('owsWalletApp.controllers').controller('IndexCtrl', function($scope, $log, appConfig) {
  $scope.appConfig = appConfig;
  $log.info('Running index controller: ' + appConfig.nameCase)
});
