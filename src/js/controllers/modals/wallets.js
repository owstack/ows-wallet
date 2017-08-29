'use strict';

angular.module('owsWalletApp.controllers').controller('walletsController', function($scope, $timeout, walletClientError, profileService, networkService) {

  $scope.selectWallet = function(walletId) {

    var client = profileService.getClient(walletId);
    $scope.errorSelectedWallet = {};

    profileService.isReady(client, function(err) {
      if (err) {
        $scope.errorSelectedWallet[walletId] = walletClientError.msg(err);
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }

      $scope.$emit('walletSelected', walletId);
    });
  };

  $scope.cancel = function() {
    $scope.walletsModal.hide();
  };

  $scope.isTestnet = function(networkURI) {
    return networkService.isTestnet(networkURI);
  };

});
