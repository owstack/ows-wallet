'use strict';

angular.module('owsWalletApp.controllers').controller('AppletViewCtrl', function($rootScope, $scope, $timeout, $log, lodash, gettextCatalog, profileService) {

  var selectedWallet;

  $scope.wallets = profileService.getWallets();
  $scope.singleWallet = $scope.wallets.length == 1;
  $scope.hasWallets = lodash.isEmpty($scope.wallets) ? false : true;

  if ($scope.hasWallets) {
    // Select first wallet if no wallet selected previously.
    $scope.wallet = $scope.wallet || $scope.wallets[0];
  }

  $rootScope.$on("Local/ChooseWalletForApplet", function(event) {
    if ($scope.singleWallet) {
      return;
    }
    $scope.walletSelectorTitle = gettextCatalog.getString('Select a wallet');
    $scope.showWallets = true;

    $timeout(function() {
      $scope.$apply();
    });
  });

  $scope.onWalletSelect = function(wallet) {
    $rootScope.$emit("Local/WalletForApplet", wallet);
    $scope.wallet = wallet;
  };

  $scope.onCancel = function() {
    $rootScope.$emit("Local/WalletForApplet");
  };

});
