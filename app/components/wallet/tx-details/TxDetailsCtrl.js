'use strict';

angular.module('owsWalletApp.controllers').controller('TxDetailsCtrl', function($rootScope, $log, $ionicHistory, $scope, $timeout, walletService, lodash, gettextCatalog, profileService, externalLinkService, popupService, ongoingProcessService, txFormatService, txConfirmNotificationService, feeService, configService, networkService) {

  var txId;
  var listeners = [];
  var config = configService.getSync();

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    txId = data.stateParams.txid;
    $scope.title = gettextCatalog.getString('Transaction');
    $scope.wallet = profileService.getWallet(data.stateParams.walletId);
    $scope.color = $scope.wallet.color;
    $scope.copayerId = $scope.wallet.credentials.copayerId;
    $scope.isShared = $scope.wallet.credentials.n > 1;
    $scope.txsUnsubscribedForNotifications = config.confirmedTxsNotifications ? !config.confirmedTxsNotifications.enabled : true;

    txConfirmNotificationService.checkIfEnabled(txId, function(res) {
      $scope.txNotification = {
        value: res
      };
    });

    updateTx();

    listeners = [
      $rootScope.$on('walletServiceEvent', function(e, walletId, type, n) {
        if (type == 'NewBlock' && n && n.data && networkService.isLivenet(n.data.network)) {
          updateTxDebounced({
            hideLoading: true
          });
        }
      })
    ];
  });

  $scope.$on("$ionicView.leave", function(event, data) {
    lodash.each(listeners, function(x) {
      x();
    });
  });

  function updateMemo() {
    walletService.getTxNote($scope.wallet, $scope.btx.txid, function(err, note) {
      if (err) {
        $log.error('Could not fetch transaction note: ' + err);
        return;
      }
      if (!note) {
        return;
      }

      $scope.btx.note = note;
      $scope.$apply();
    });
  }

  function initActionList() {
    $scope.actionList = [];
    if ($scope.btx.action != 'sent' || !$scope.isShared) return;

    var actionDescriptions = {
      created: gettextCatalog.getString('Proposal Created'),
      accept: gettextCatalog.getString('Accepted'),
      reject: gettextCatalog.getString('Rejected'),
      broadcasted: gettextCatalog.getString('Broadcasted'),
    };

    $scope.actionList.push({
      type: 'created',
      time: $scope.btx.createdOn,
      description: actionDescriptions['created'],
      by: $scope.btx.creatorName
    });

    lodash.each($scope.btx.actions, function(action) {
      $scope.actionList.push({
        type: action.type,
        time: action.createdOn,
        description: actionDescriptions[action.type],
        by: action.copayerName
      });
    });

    $scope.actionList.push({
      type: 'broadcasted',
      time: $scope.btx.time,
      description: actionDescriptions['broadcasted'],
    });

    $timeout(function() {
      $scope.actionList.reverse();
    }, 10);
  }

  var updateTx = function(opts) {
    opts = opts || {};
    if (!opts.hideLoading) {
      ongoingProcessService.set('loadingTxInfo', true);
    }
    walletService.getTx($scope.wallet, txId, function(err, tx) {
      if (!opts.hideLoading) {
        ongoingProcessService.set('loadingTxInfo', false);
      }
      if (err) {
        $log.error('Error getting transaction: ' + err);
        $ionicHistory.goBack();
        return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Transaction not available at this time.'));
      }

      $scope.btx = txFormatService.processTx(tx, $scope.wallet.networkURI);
      
      txFormatService.formatAlternativeStr($scope.wallet.networkURI, tx.fees, function(v) {
        $scope.btx.feeFiatStr = v;
        $scope.btx.feeRateStr = ($scope.btx.fees / ($scope.btx.amount + $scope.btx.fees) * 100).toFixed(2) + '%';
      });

      if ($scope.btx.action != 'invalid') {
        if ($scope.btx.action == 'sent') {
          $scope.title = gettextCatalog.getString('Sent Funds');
        }

        if ($scope.btx.action == 'received') {
          $scope.title = gettextCatalog.getString('Received Funds');
        }

        if ($scope.btx.action == 'moved') {
          $scope.title = gettextCatalog.getString('Moved Funds');
        }
      }

      updateMemo();
      initActionList();
      getFiatRate();
      $timeout(function() {
        $scope.$digest();
      });

      feeService.getFeeLevels($scope.wallet, function(err, levels) {
        if (err) {
          return;
        }
        walletService.getLowAmount($scope.wallet, levels, function(err, amount) {
          if (err) {
            return;
          }
          $scope.btx.lowAmount = (tx.amount < amount);

          $timeout(function() {
            $scope.$apply();
          });
        });
      });
    });
  };

  var updateTxDebounced = lodash.debounce(updateTx, 5000);

  $scope.showMemoPopup = function() {
    var opts = {};
    if ($scope.btx.message) {
      opts.defaultText = $scope.btx.message;
    }

    if ($scope.btx.note && $scope.btx.note.body) {
      opts.defaultText = $scope.btx.note.body;
    }

    popupService.showPrompt(gettextCatalog.getString('Set Memo'), null, opts, function(text) {
      if (typeof text == "undefined") {
        return;
      }
      $log.debug('Saving memo');

      $scope.btx.note = {
        body: text
      };

      var args = {
        txid: $scope.btx.txid,
        body: text
      };

      walletService.editTxNote($scope.wallet, args, function(err, res) {
        if (err) {
          $log.debug('Could not save tx memo ' + err);
        }
      });
    });
  };

  $scope.viewOnBlockchain = function() {
    var btx = $scope.btx;
    var explorer = networkService.getNetworkByURI($scope.wallet.networkURI).explorer.production;
    var url = explorer.urlTx + btx.txid;
    var optIn = true;
    var title = gettextCatalog.getString('View On Blockchain');
    var message = gettextCatalog.getString('View Transaction on ' + explorer.label);
    var okText = gettextCatalog.getString('Open ' + explorer.label);
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

  var getFiatRate = function() {
    $scope.alternativeIsoCode = $scope.wallet.status.alternativeIsoCode;
    $scope.wallet.getFiatRate({
      code: $scope.alternativeIsoCode,
      ts: $scope.btx.time * 1000
    }, function(err, res) {
      if (err) {
        $log.debug('Could not get historic rate');
        return;
      }
      if (res && res.rate) {
        $scope.rateDate = res.fetchedOn;
        $scope.rate = res.rate;
      }
    });
  };

  $scope.txConfirmNotificationChange = function() {
    if ($scope.txNotification.value) {
      txConfirmNotificationService.subscribe($scope.wallet, {
        txid: txId
      });
    } else {
      txConfirmNotificationService.unsubscribe($scope.wallet, txId);
    }
  };

});
