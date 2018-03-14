'use strict';

angular.module('owsWalletApp.controllers').controller('ReceiveCtrl', function($rootScope, $scope, $timeout, $log, $ionicModal, $state, $ionicHistory, $ionicPopover, platformInfoService, walletService, profileService, lodash, gettextCatalog, popupService, networkService) {

  var listeners = [];
  $scope.isCordova = platformInfoService.isCordova;
  $scope.isNW = platformInfoService.isNW;

  $scope.requestSpecificAmount = function() {
    $state.go($rootScope.sref('payment-request.amount'), {
      walletId: $scope.wallet.credentials.walletId,
      networkURI: $scope.wallet.networkURI
    });
  };

  $scope.setAddress = function(newAddr) {
    $scope.addr = null;
    if (!$scope.wallet || $scope.generatingAddress || !$scope.wallet.isComplete()) {
      return;
    }
    $scope.generatingAddress = true;
    walletService.getAddress($scope.wallet, newAddr, function(err, addr) {
      $scope.generatingAddress = false;

      if (err) {
        //Error is already formated
        popupService.showAlert(err);
      }

      $scope.addr = addr;
      $timeout(function() {
        $scope.$apply();
      }, 10);
    });
  };

  $scope.goCopayers = function() {
    $ionicHistory.removeBackView();
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });
    $state.go($rootScope.sref('home'));
    $timeout(function() {
      $state.transitionTo($rootScope.sref('copayers'), {
        walletId: $scope.wallet.credentials.walletId
      });
    }, 100);
  };

  $scope.close = function() {
    $scope.BackupNeededModal.hide();
    $scope.BackupNeededModal.remove();
  };

  $scope.doBackup = function() {
    $scope.close();
    $scope.goToBackupFlow();
  };

  $scope.goToBackupFlow = function() {
    $state.go($rootScope.sref('receive.backup-warning'), {
      from: 'receive',
      walletId: $scope.wallet.credentials.walletId
    });
  };

  $scope.shouldShowReceiveAddressFromHardware = function() {
    return false;
  };

  $scope.showReceiveAddressFromHardware = function() {
    var wallet = $scope.wallet;
    if (wallet.isPrivKeyExternal() && wallet.credentials.hwInfo) {
      walletService.showReceiveAddressFromHardware(wallet, $scope.addr, function() {});
    }
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    var walletId = data.stateParams.walletId;
    $scope.wallets = profileService.getWallets();
    $scope.singleWallet = $scope.wallets.length == 1;
    $scope.hasWallets = lodash.isEmpty($scope.wallets) ? false : true;

    if (!$scope.hasWallets) {
      return;
    }

    // select first wallet if no wallet selected previously
    var selectedWallet = checkSelectedWallet(walletId, $scope.wallet, $scope.wallets);
    $scope.onWalletSelect(selectedWallet);

    $scope.showShareButton = platformInfoService.isCordova ? (platformInfoService.isIOS ? 'iOS' : 'Android') : null;

    listeners = [
      $rootScope.$on('walletServiceEvent', function(e, walletId, type, n) {
        // Update current address
        if ($scope.wallet && walletId == $scope.wallet.id && type == 'NewIncomingTx') {
          $scope.setAddress(true);
        }
      })
    ];
  });

  $scope.$on("$ionicView.leave", function(event, data) {
    lodash.each(listeners, function(x) {
      x();
    });
  });

  var checkSelectedWallet = function(walletId, wallet, wallets) {
    var wid = walletId;

    if (!wid) {
      if (!wallet) {
        return wallets[0];
      }
      wid = wallet.id;
    }

    var w = lodash.find(wallets, function(w) {
      return w.id == wid;
    });

    if (!w) {
      return wallets[0];
    }
    return w;
  }

  var setProtocol = function() {
    $scope.protocol = networkService.getNetworkByURI($scope.wallet.networkURI).protocol;
  }

  $scope.onWalletSelect = function(wallet) {
    $scope.wallet = wallet;
    $scope.setAddress();
    setProtocol();
  };

  $scope.showWalletSelector = function() {
    if ($scope.singleWallet) return;
    $scope.walletSelectorTitle = gettextCatalog.getString('Select a wallet');
    $scope.showWallets = true;
  };

  $scope.shareAddress = function() {
    if (!$scope.isCordova) return;
    window.plugins.socialsharing.share($scope.protocol + ':' + $scope.addr, null, null, null);
  };

  $scope.createWallet = function() {
    $state.go($rootScope.sref('home')).then(function() {
      $state.go($rootScope.sref('add.create-personal'));
    });
  };

});
