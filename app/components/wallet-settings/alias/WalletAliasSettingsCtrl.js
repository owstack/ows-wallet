'use strict';

angular.module('owsWalletApp.controllers').controller('WalletAliasSettingsCtrl',
  function($scope, $timeout, $stateParams, $ionicHistory, $log, profileService, walletService) {
    var wallet = profileService.getWallet($stateParams.walletId);
    var walletId = wallet.credentials.walletId;

    $scope.walletName = wallet.credentials.walletName;
    $scope.walletAlias = walletService.getPreferences(walletId).alias || wallet.credentials.walletName;
    $scope.alias = {
      value: $scope.walletAlias
    };

    $scope.save = function() {
      walletService.setPreference(walletId, 'alias', $scope.alias.value, function(err) {
        if (err) {
          $log.warn(err);
        }
        $ionicHistory.goBack();
      });
    };

  });
