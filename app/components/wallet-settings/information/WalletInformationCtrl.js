'use strict';

angular.module('owsWalletApp.controllers').controller('WalletInformationCtrl', function($scope, $log, $ionicHistory, platformInfoService, lodash, profileService, $stateParams, walletService, networkService) {
  var wallet = profileService.getWallet($stateParams.walletId);
  var walletId = wallet.id;

  $scope.isCordova = platformInfoService.isCordova;

  $scope.$on("$ionicView.enter", function(event, data) {
    var c = wallet.credentials;
    var basePath = c.getBaseAddressDerivationPath();
    var network = networkService.getNetworkByName(wallet.networkName);

    $scope.wallet = wallet;
    $scope.walletName = c.walletName;
    $scope.walletId = c.walletId;
    $scope.networkLabel = network.longLabel;
    $scope.addressType = c.addressType || 'P2SH';
    $scope.derivationStrategy = c.derivationStrategy || 'BIP45';
    $scope.basePath = basePath;
    $scope.M = c.m;
    $scope.N = c.n;
    $scope.pubKeys = lodash.map(c.publicKeyRing, 'xPubKey');
    $scope.externalSource = null;
    $scope.standardUnit = network.Unit().standardsName();

    if (wallet.isPrivKeyExternal()) {
      $scope.externalSource = lodash.find(walletService.externalSource, function(source) {
        return source.id == wallet.getPrivKeyExternalSourceName();
      }).name;
    }
  });

});
