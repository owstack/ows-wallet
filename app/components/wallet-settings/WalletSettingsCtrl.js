'use strict';

angular.module('owsWalletApp.controllers').controller('WalletSettingsCtrl',
  function($scope, $rootScope, $timeout, $log, $ionicHistory, /*$ionicNativeTransitions,*/ lodash, configService, profileService, fingerprintService, walletService) {
    var wallet;
    var walletId;

    $scope.hiddenBalanceChange = function() {
      var opts = {
        balance: {
          enabled: $scope.hiddenBalance.value
        }
      };
      profileService.toggleHideBalanceFlag(walletId, function(err) {
        if (err) $log.error(err);
      });
    };

    $scope.encryptChange = function() {
      if (!wallet) return;
      var val = $scope.encryptEnabled.value;

      if (val && !walletService.isEncrypted(wallet)) {
        $log.debug('Encrypting private key for', wallet.name);
        walletService.encrypt(wallet, function(err) {
          if (err) {
            $log.warn(err);

            // TODO-AJP: show error?
            $scope.encryptEnabled.value = false;
            $timeout(function() {
              $scope.$apply();
            });
            return;
          }
          profileService.updateCredentials(JSON.parse(wallet.export()), function() {
            $log.debug('Wallet encrypted');
            return;
          });
        })
      } else if (!val && walletService.isEncrypted(wallet)) {
        walletService.decrypt(wallet, function(err) {
          if (err) {
            $log.warn(err);

            // TODO-AJP: show error?
            $scope.encryptEnabled.value = true;
            $timeout(function() {
              $scope.$apply();
            });
            return;
          }
          profileService.updateCredentials(JSON.parse(wallet.export()), function() {
            $log.debug('Wallet decrypted');
            return;
          });
        })
      }
    };

    $scope.touchIdChange = function() {
      var newStatus = $scope.touchIdEnabled.value;
      walletService.setTouchId(wallet, !!newStatus, function(err) {
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

    $scope.goBackToWallet = function() {
      // Reset (clear) history in the settings tab for subsequent deterministic navigation (results in
      // main settings view being shown when using tab bar).
      delete $ionicHistory.viewHistory().histories[$ionicHistory.currentHistoryId()];

//      $ionicNativeTransitions.stateGo('tabs.wallet', {
      $state.go('tabs.wallet', {
        walletId: walletId
//      }, {}, {
//        type: 'slide',
//        direction: 'right'
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.hideTabs = data.stateParams.fromWallet || undefined;
      $scope.showBackButton = data.stateParams.fromWallet || false;

      wallet = profileService.getWallet(data.stateParams.walletId);
      walletId = wallet.credentials.walletId;
      $scope.wallet = wallet;
      $scope.externalSource = null;

      if (!wallet)
        return $ionicHistory.goBack();

      var config = configService.getSync();

      $scope.hiddenBalance = {
        value: $scope.wallet.balanceHidden
      };

      $scope.encryptEnabled = {
        value: walletService.isEncrypted(wallet)
      };

      $scope.touchIdAvailable = fingerprintService.isAvailable();
      $scope.touchIdEnabled = {
        value: config.touchIdFor ? config.touchIdFor[walletId] : null
      };

      $scope.deleted = false;
      if (wallet.credentials && !wallet.credentials.mnemonicEncrypted && !wallet.credentials.mnemonic) {
        $scope.deleted = true;
      }
    });
  });
