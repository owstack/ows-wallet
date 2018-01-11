'use strict';

angular.module('owsWalletApp.controllers').controller('preferencesInformation',
  function($scope, $log, $ionicHistory, platformInfo, lodash, profileService, configService, $stateParams, $state, walletService, networkService) {
    var wallet = profileService.getWallet($stateParams.walletId);
    var walletId = wallet.id;
    var config = configService.getSync();
    var colorCounter = 1;
    var BLACK_WALLET_COLOR = '#202020';

    $scope.isCordova = platformInfo.isCordova;

    $scope.saveBlack = function() {
      function save(color) {
        walletService.setPreference(walletId, 'color', color, function(err) {
          if (err) {
            $log.warn(err);
          }
          $ionicHistory.removeBackView();
          $state.go('tabs.home');
        });
      };

      if (colorCounter != 5) return colorCounter++;
      save(BLACK_WALLET_COLOR);
    };

    $scope.$on("$ionicView.enter", function(event, data) {
      var c = wallet.credentials;
      var basePath = c.getBaseAddressDerivationPath();

      $scope.wallet = wallet;
      $scope.walletName = c.walletName;
      $scope.walletId = c.walletId;
      $scope.networkLabel = networkService.getNetworkByURI(wallet.networkURI).getNetLabel();
      $scope.addressType = c.addressType || 'P2SH';
      $scope.derivationStrategy = c.derivationStrategy || 'BIP45';
      $scope.basePath = basePath;
      $scope.M = c.m;
      $scope.N = c.n;
      $scope.pubKeys = lodash.pluck(c.publicKeyRing, 'xPubKey');
      $scope.externalSource = null;
      $scope.standardUnit = networkService.getStandardUnit(wallet.networkURI);

      if (wallet.isPrivKeyExternal()) {
        $scope.externalSource = lodash.find(walletService.externalSource, function(source) {
          return source.id == wallet.getPrivKeyExternalSourceName();
        }).name;
      }
    });

  });
