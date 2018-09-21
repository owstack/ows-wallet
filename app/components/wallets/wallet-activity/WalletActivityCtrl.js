'use strict';

angular.module('owsWalletApp.controllers').controller('WalletActivityCtrl',
  function($rootScope, $timeout, $scope, $log, lodash, txpModalService, profileService, walletService, ongoingProcessService, popupService, gettextCatalog, $state) {
    $scope.openTxpModal = txpModalService.open;
    $scope.fetchingNotifications = true;

    $scope.$on("$ionicView.enter", function(event, data) {
      profileService.getNotifications(50, function(err, n) {
        if (err) {
          $log.error(err);
          return;
        }
        $scope.fetchingNotifications = false;
        $scope.notifications = n;

        profileService.getTxps({}, function(err, txps, n) {
          if (err) {
            $log.error(err);
          }
          $scope.txps = txps;
          $timeout(function() {
            $scope.$apply();
          });
        });
      });
    });

    $scope.openNotificationModal = function(n) {
      if (n.txid) {
        $state.transitionTo($rootScope.sref('wallet.tx-details'), {
          txid: n.txid,
          walletId: n.walletId
        });
      } else {
        var txp = lodash.find($scope.txps, {
          id: n.txpId
        });
        if (txp) txpModalService.open(txp);
        else {
          ongoingProcessService.set('loadingTxInfo', true);
          walletService.getTxp(n.wallet, n.txpId, function(err, txp) {
            var _txp = txp;
            ongoingProcessService.set('loadingTxInfo', false);
            if (err) {
              $log.error('No txp found');
              return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Transaction not found.'));
            }
            txpModalService.open(_txp);
          });
        }
      }
    };
  });
