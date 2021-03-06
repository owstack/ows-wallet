'use strict';

angular.module('owsWalletApp.controllers').controller('WalletAddressesCtrl', function($rootScope, $scope, $log, $stateParams, $state, $timeout, $ionicHistory, $ionicScrollDelegate, popupService, gettextCatalog, ongoingProcessService, lodash, profileService, walletService, errorService, platformInfoService, appConfig, txFormatService, helpService, networkService) {
  var UNUSED_ADDRESS_LIMIT = 5;
  var BALANCE_ADDRESS_LIMIT = 5;
  var withBalance, cachedWallet;

  $scope.isCordova = platformInfoService.isCordova;

  $scope.$on("$ionicView.afterEnter", function(event, data) {
    profileService.whenAvailable(function() {
      $scope.wallet = profileService.getWallet($stateParams.walletId);

      if (!isCachedWallet($stateParams.walletId)) {
        $scope.init();
      } else {
        $log.debug('Addresses cached for Wallet:', $stateParams.walletId);
      }
    });
  });

  function resetValues() {
    $scope.loading = false;
    $scope.showInfo = false;
    $scope.latestUnused = $scope.latestWithBalance = null;
    $scope.viewAll = {
      value: false
    };
  };

  $scope.init = function() {
    resetValues();
    $scope.loading = true;

    walletService.getMainAddresses($scope.wallet, {}, function(err, addresses) {
      if (err) {
        $scope.loading = false;
        return popupService.showAlert(errorService.msg(err, {prefix: gettextCatalog.getString('Could not update wallet')}));
      }

      var allAddresses = addresses;

      walletService.getBalance($scope.wallet, {}, function(err, resp) {
        if (err) {
          $scope.loading = false;
          return popupService.showAlert(errorService.msg(err, {prefix: gettextCatalog.getString('Could not update wallet')}));
        }

        withBalance = resp.byAddress;
        var idx = lodash.keyBy(withBalance, 'address');
        $scope.noBalance = lodash.reject(allAddresses, function(x) {
          return idx[x.address];
        });

        processPaths($scope.noBalance);
        processPaths(withBalance);

        $scope.latestUnused = lodash.slice($scope.noBalance, 0, UNUSED_ADDRESS_LIMIT);
        $scope.latestWithBalance = lodash.slice(withBalance, 0, BALANCE_ADDRESS_LIMIT);

        lodash.each(withBalance, function(a) {
          a.balanceStr = txFormatService.formatAmountStr($scope.wallet.networkName, a.amount);
        });

        $scope.viewAll = {
          value: $scope.noBalance.length > UNUSED_ADDRESS_LIMIT || withBalance.length > BALANCE_ADDRESS_LIMIT
        };
        $scope.allAddresses = $scope.noBalance.concat(withBalance);

        cachedWallet = $scope.wallet.id;
        $scope.loading = false;
        $log.debug('Addresses cached for Wallet:', cachedWallet);
        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$digest();
        });
      });
    });

    walletService.getLowUtxos($scope.wallet, function(err, resp) {
      if (err || !resp) {
        return;
      }
      if (resp.allUtxos && resp.allUtxos.length) {
        var atomicUnit = network.Unit().atomicsName;
        var allSum = lodash.sum(resp.allUtxos || 0, atomicUnit);
        var per = (resp.minFee / allSum) * 100;

        $scope.lowWarning = resp.warning;
        $scope.lowUtxosNb = resp.lowUtxos.length;
        $scope.allUtxosNb = resp.allUtxos.length;
        $scope.lowUtxosSum = txFormatService.formatAmountStr($scope.wallet.networkName, lodash.sum(resp.lowUtxos || 0, atomicUnit));
        $scope.allUtxosSum = txFormatService.formatAmountStr($scope.wallet.networkName, allSum);
        $scope.minFee = txFormatService.formatAmountStr($scope.wallet.networkName, resp.minFee || 0);
        $scope.minFeePer = per.toFixed(2) + '%';
      }
    });
  };

  function processPaths(list) {
    lodash.each(list, function(n) {
      n.path = n.path.replace(/^m/g, 'xpub');
    });
  };

  $scope.newAddress = function() {
    if ($scope.gapReached) return;

    ongoingProcessService.set('generatingNewAddress', true);
    walletService.getAddress($scope.wallet, true, function(err, addr) {
      if (err) {
        ongoingProcessService.set('generatingNewAddress', false);
        if (err.toString().match('MAIN_ADDRESS_GAP_REACHED')) {
          $scope.gapReached = true;
        } else {
          popupService.showAlert(err);
        }
        $timeout(function() {
          $scope.$digest();
        });
        return;
      }

      walletService.getMainAddresses($scope.wallet, {
        limit: 1
      }, function(err, _addr) {
        ongoingProcessService.set('generatingNewAddress', false);
        if (err) return popupService.showAlert(gettextCatalog.getString('Error'), err);
        if (addr != _addr[0].address) return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('New address could not be generated. Please try again.'));

        $scope.noBalance = [_addr[0]].concat($scope.noBalance);
        $scope.latestUnused = lodash.slice($scope.noBalance, 0, UNUSED_ADDRESS_LIMIT);
        $scope.viewAll = {
          value: $scope.noBalance.length > UNUSED_ADDRESS_LIMIT
        };
        $scope.$digest();
      });
    });
  };

  $scope.viewAllAddresses = function() {
    var fromView = $ionicHistory.currentStateName();
    var path;
    if (fromView.indexOf('settings') !== -1) {
      path = 'settings.all-addresses';
    } else {
      path = 'wallet.all-addresses';
    }
    $state.go($rootScope.sref(path), {
      walletId: $scope.wallet.id
    });
  };

  $scope.showInformation = function() {
    $timeout(function() {
      $scope.showInfo = !$scope.showInfo;
      $ionicScrollDelegate.resize();
    }, 10);
  };

  $scope.learnMore = function() {
    // TODO-AJP:
    var locationPrefix = 'tbd';
    var topicId = 'tbd';
    helpService.learnMore($scope, locationPrefix, topicId);
  };

  $scope.scan = function() {
    walletService.startScan($scope.wallet);
  };

  $scope.sendByEmail = function() {
    function formatDate(ts) {
      var dateObj = new Date(ts * 1000);
      if (!dateObj) {
        $log.debug('Error formating a date');
        return 'DateError';
      }
      if (!dateObj.toJSON()) {
        return '';
      }
      return dateObj.toJSON();
    };

    ongoingProcessService.set('sendingByEmail', true);
    $timeout(function() {
      var appName = appConfig.nameCase;
      var body = appName + ' Wallet "' + $scope.wallet.name + '" Addresses\n  Only Main Addresses are  shown.\n\n';
      body += "\n";
      body += $scope.allAddresses.map(function(v) {
        return ('* ' + v.address + ' xpub' + v.path.substring(1) + ' ' + formatDate(v.createdOn));
      }).join("\n");
      ongoingProcessService.set('sendingByEmail', false);

      window.plugins.socialsharing.shareViaEmail(
        body,
        appName + ' Addresses',
        null, // TO: must be null or an array
        null, // CC: must be null or an array
        null, // BCC: must be null or an array
        null, // FILES: can be null, a string, or an array
        function() {},
        function() {}
      );
    });
  };

  function isCachedWallet(walletId) {
    if (cachedWallet && cachedWallet == walletId) {
      return true;
    } else {
      return false;
    }
  };
});
