'use strict';

angular.module('owsWalletApp.controllers').controller('tabsController', function($rootScope, $log, $scope, $state, $stateParams, $timeout, incomingData, lodash, popupService, gettextCatalog, scannerService) {

  $scope.onScan = function(data) {
    if (!incomingData.redir(data)) {
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
