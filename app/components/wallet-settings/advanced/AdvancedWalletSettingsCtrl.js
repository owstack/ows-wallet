'use strict';

angular.module('owsWalletApp.controllers').controller('AdvancedWalletSettingsCtrl', function($scope, $stateParams, profileService) {
  $scope.walletId = $stateParams.walletId;
  $scope.wallet = profileService.getWallet($scope.walletId);
});
