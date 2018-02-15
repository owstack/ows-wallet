'use strict';

angular.module('owsWalletApp.controllers').controller('TabsCtrl', function($rootScope, $log, $scope, $state, $stateParams, $timeout, incomingDataService, lodash, popupService, gettextCatalog) {

  $scope.onScan = function(data) {
    if (!incomingDataService.redir(data)) {
      popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid data'));
    }
  };

  $scope.setScanFn = function(scanFn) {
    $scope.scan = function() {
      $log.debug('Scanning...');
      scanFn();
    };
  };

  $scope.importInit = function() {
    $scope.fromOnboarding = $stateParams.fromOnboarding;
    $timeout(function() {
      $scope.$apply();
    }, 1);
  };

  $scope.chooseScanner = function() {
    $state.go('tabs.scan');
  };

});
