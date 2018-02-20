'use strict';

angular.module('owsWalletApp.controllers').controller('AdvancedWalletSettingsCtrl', function($scope, $timeout, $state, $stateParams, profileService) {
  var wallet = profileService.getWallet($stateParams.walletId);
  $scope.networkURI = wallet.networkURI;
  $scope.wallet = wallet;

  $scope.goToAddresses = function() {
    $state.go('tabs.settings.addresses', {
      walletId: $stateParams.walletId,
    });
  };

  $timeout(function() {
    $scope.$apply();
  }, 1);
});
