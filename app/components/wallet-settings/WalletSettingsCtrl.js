'use strict';

angular.module('owsWalletApp.controllers').controller('WalletSettingsCtrl', function($scope, $rootScope, $timeout, $log, $ionicHistory, configService, profileService, fingerprintService, walletService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.walletId = data.stateParams.walletId;
    $scope.wallet = profileService.getWallet($scope.walletId);
    $scope.externalSource = null;

    if (!$scope.wallet) {
      return $ionicHistory.goBack();
    }

    $scope.walletCanSign = $scope.wallet.canSign();

    var config = configService.getSync();

    $scope.hiddenBalance = {
      value: $scope.wallet.balanceHidden
    };

    $scope.encryptEnabled = {
      value: walletService.isEncrypted($scope.wallet)
    };

    $scope.touchIdAvailable = fingerprintService.isAvailable();
    $scope.touchIdEnabled = {
      value: walletService.getTouchId($scope.walletId)
    };

    $scope.deleted = false;
    if ($scope.wallet.credentials && !$scope.wallet.credentials.mnemonicEncrypted && !$scope.wallet.credentials.mnemonic) {
      $scope.deleted = true;
    }
  });
  
  $scope.hiddenBalanceChange = function() {
    var opts = {
      balance: {
        enabled: $scope.hiddenBalance.value
      }
    };
    profileService.toggleHideBalanceFlag($scope.walletId, function(err) {
      if (err) {
        $log.error(err);
      }
    });
  };

  $scope.encryptChange = function() {
    if (!$scope.wallet) {
      return;
    }
    var val = $scope.encryptEnabled.value;

    if (val && !walletService.isEncrypted($scope.wallet)) {
      $log.debug('Encrypting private key for', $scope.wallet.name);
      walletService.encrypt($scope.wallet, function(err) {
        if (err) {
          $log.error(err);

          // TODO-AJP: show error?
          $scope.encryptEnabled.value = false;
          $timeout(function() {
            $scope.$apply();
          });
          return;
        }
        profileService.updateCredentials(JSON.parse($scope.wallet.export()), function() {
          $log.debug('Wallet encrypted');
          return;
        });
      })
    } else if (!val && walletService.isEncrypted($scope.wallet)) {
      walletService.decrypt($scope.wallet, function(err) {
        if (err) {
          $log.error(err);

          // TODO-AJP: show error?
          $scope.encryptEnabled.value = true;
          $timeout(function() {
            $scope.$apply();
          });
          return;
        }
        profileService.updateCredentials(JSON.parse($scope.wallet.export()), function() {
          $log.debug('Wallet decrypted');
          return;
        });
      })
    }
  };

  $scope.touchIdChange = function() {
    var newStatus = $scope.touchIdEnabled.value;
    walletService.setTouchId($scope.wallet, !!newStatus, function(err) {
      if (err) {
        $scope.touchIdEnabled.value = !newStatus;
        $timeout(function() {
          $scope.$apply();
        }, 1);
        return;
      }
      $log.debug('Touch Id status changed: ' + newStatus);
    });
  };

});
