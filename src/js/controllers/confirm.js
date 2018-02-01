'use strict';

angular.module('owsWalletApp.controllers').controller('confirmController', function($rootScope, $scope, $interval, $filter, $timeout, $ionicScrollDelegate, gettextCatalog, walletService, platformInfo, lodash, configService, rateService, $stateParams, $window, $state, $log, profileService, txFormatService, ongoingProcess, $ionicModal, popupService, $ionicHistory, $ionicConfig, payproService, feeService, walletClientError, txConfirmNotification, networkService) {

  var countDown = null;
  var CONFIRM_LIMIT_USD = 20;
  var FEE_TOO_HIGH_LIMIT_PER = 15;

  var tx = {};
  var config = configService.getSync();

  // Platform info
  var isCordova = platformInfo.isCordova;

  //custom fee flag
  var usingCustomFee = null;

  function refresh() {
    $timeout(function() {
      $scope.$apply();
    }, 1);
  }


  $scope.showWalletSelector = function() {
    $scope.walletSelector = true;
    refresh();
  };

  $scope.$on("$ionicView.beforeLeave", function(event, data) {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    $ionicConfig.views.swipeBackEnabled(false);
  });


  function exitWithError(err) {
    $log.info('Error setting wallet selector:' + err);
    popupService.showAlert(gettextCatalog.getString(), walletClientError.msg(err), function() {
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        historyRoot: true
      });
      $ionicHistory.clearHistory();
      $state.go('tabs.send');
    });
  };

  function setWarning(title, message) {
    $scope.wallet = null;
    $scope.warning = {
      title: title,
      message: message
    };
    $log.warn('Not ready to make the payment:' + message);
    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    function setWalletSelector(networkURI, minAmount, cb) {
      // no min amount? (sendMax) => look for no empty wallets
      minAmount = minAmount || 1;

      $scope.wallets = profileService.getWallets({
        onlyComplete: true,
        networkURI: networkURI
      });

      if (!$scope.wallets || !$scope.wallets.length) {
        popupService.showAlert(gettextCatalog.getString('Insufficient Funds'), gettextCatalog.getString('There are no wallets with an available balance to create a transaction.'));
        return cb();
      }

      var filteredWallets = [];
      var index = 0;
      var walletsUpdated = 0;

      lodash.each($scope.wallets, function(w) {
        walletService.getStatus(w, {}, function(err, status) {
          if (err || !status) {
            $log.error(err);
          } else {
            walletsUpdated++;
            w.status = status;

            if (!status.availableBalanceAtomic)
              $log.debug('No balance available in: ' + w.name);

            if (status.availableBalanceAtomic > minAmount) {
              filteredWallets.push(w);
            }
          }

          if (++index == $scope.wallets.length) {
            if (!walletsUpdated)
              return cb('Could not update any wallet');

            if (lodash.isEmpty(filteredWallets)) {
              popupService.showAlert(gettextCatalog.getString('Insufficient Funds'), gettextCatalog.getString('Not enough funds to create a transaction from any wallet.'));
            }
            $scope.wallets = lodash.clone(filteredWallets);
            return cb();
          }
        });
      });
    };

    // Grab stateParams
    tx = {
      toAmount: parseInt(data.stateParams.toAmount),
      sendMax: data.stateParams.useSendMax == 'true' ? true : false,
      toAddress: data.stateParams.toAddress,
      description: data.stateParams.description,
      paypro: data.stateParams.paypro,

      feeLevel: config.currencyNetworks[data.stateParams.networkURI].feeLevel,
      spendUnconfirmed: config.wallet.spendUnconfirmed,

      // Vanity tx info (not in the real tx)
      networkURI: data.stateParams.networkURI,
      currency: networkService.getNetworkByURI(data.stateParams.networkURI).currency,
      recipientType: data.stateParams.recipientType || null,
      toName: data.stateParams.toName,
      toEmail: data.stateParams.toEmail,
      toColor: data.stateParams.toColor,
      txp: {}
    };

    // The wallet originating the send request.
    var desiredWalletId = data.stateParams.walletId;

    // Other Scope vars
    $scope.isCordova = isCordova;
    $scope.showAddress = false;

    updateTx(tx, null, {}, function() {
      $scope.walletSelectorTitle = gettextCatalog.getString('Send from');

      setWalletSelector(tx.networkURI, tx.toAmount, function(err) {
        if (err) {
          return exitWithError('Could not update wallets');
        }

        if (!desiredWalletId) {

          // Either show the wallet selector or choose the one wallet found.
          if ($scope.wallets.length > 1) {
            $scope.showWalletSelector();
          } else if ($scope.wallets.length) {
            setWallet($scope.wallets[0], tx);
          }

        } else {

          if ($scope.wallets.length > 1) {

            var desiredWallet = lodash.find($scope.wallets, function(w) {
              return w.credentials.walletId == desiredWalletId;
            });

            if (!desiredWallet) {
              // Cannot send from the desiredWallet, it was filtered out of the list.
              // Show wallet selector to choose another.
              $scope.showWalletSelector();
            } else {
              // Use the desiredWallet to send.
              setWallet(desiredWallet, tx);
            }

          } else {

            // The one wallet found may not be the desiredWallet (we select it anyway); if it's not then let the user
            // know that we could not select the desired wallet to send from.
            if ($scope.wallets[0].credentials.walletId != desiredWalletId) {
              popupService.showAlert(gettextCatalog.getString('Insufficient Funds'), gettextCatalog.getString('Not enough funds for fee in selected wallet. Choose another wallet.'));
            }
            setWallet($scope.wallets[0], tx);
          }
        }
      });

    });
  });

  function getSendMaxInfo(tx, wallet, cb) {
    if (!tx.sendMax) return cb();

    //ongoingProcess.set('retrievingInputs', true);
    walletService.getSendMaxInfo(wallet, {
      feePerKb: tx.feeRate,
      excludeUnconfirmedUtxos: !tx.spendUnconfirmed,
      returnInputs: true,
    }, cb);
  };


  function getTxp(tx, wallet, dryRun, cb) {

    // ToDo: use a credential's (or fc's) function for this
    if (tx.description && !wallet.credentials.sharedEncryptingKey) {
      var msg = gettextCatalog.getString('Could not add message to imported wallet without shared encrypting key');
      $log.warn(msg);
      return setSendError(msg);
    }

    if (tx.toAmount > Number.MAX_SAFE_INTEGER) {
      var msg = gettextCatalog.getString('Amount too big');
      $log.warn(msg);
      return setSendError(msg);
    }

    var txp = {};

    txp.outputs = [{
      'toAddress': tx.toAddress,
      'amount': tx.toAmount,
      'message': tx.description
    }];

    if (tx.sendMaxInfo) {
      txp.inputs = tx.sendMaxInfo.inputs;
      txp.fee = tx.sendMaxInfo.fee;
    } else {
      if (usingCustomFee) {
        txp.feePerKb = tx.feeRate;
      } else txp.feeLevel = tx.feeLevel;
    }

    txp.message = tx.description;

    if (tx.paypro) {
      txp.payProUrl = tx.paypro.url;
    }
    txp.excludeUnconfirmedUtxos = !tx.spendUnconfirmed;
    txp.dryRun = dryRun;
    walletService.createTx(wallet, txp, function(err, ctxp) {
      if (err) {
        setSendError(err);
        return cb(err);
      }
      return cb(null, ctxp);
    });
  };

  function updateTx(tx, wallet, opts, cb) {
    var networkURI = (lodash.isObject(wallet) ? wallet.networkURI : tx.networkURI);

    if (opts.clearCache) {
      tx.txp = {};
    }

    $scope.tx = tx;

    function updateAmount() {
      if (!tx.toAmount) return;

      // Amount
      tx.amountStr = txFormatService.formatAmountStr(networkURI, tx.toAmount);
      tx.amountValueStr = tx.amountStr.split(' ')[0];
      tx.amountAtomicStr = tx.amountStr.split(' ')[1];
      txFormatService.formatAlternativeStr(networkURI, tx.toAmount, function(v) {
        tx.alternativeAmountStr = v;
      });
    }

    updateAmount();
    refresh();

    // End of quick refresh, before wallet is selected.
    if (!wallet) return cb();

    feeService.getFeeRate(tx.feeLevel, wallet, function(err, feeRate) {
      if (err) return cb(err);

      if (!usingCustomFee) tx.feeRate = feeRate;
      tx.feeLevelName = feeService.getFeeOpts(networkURI, tx.feeLevel);

      if (!wallet)
        return cb();

      getSendMaxInfo(lodash.clone(tx), wallet, function(err, sendMaxInfo) {
        if (err) {
          var msg = gettextCatalog.getString('Error getting SendMax information');
          return setSendError(msg);
        }

        if (sendMaxInfo) {
          $log.debug('Send max info', sendMaxInfo);

          if (tx.sendMax && sendMaxInfo.amount == 0) {
            popupService.showAlert(gettextCatalog.getString('Insufficient Funds'), gettextCatalog.getString('Not enough funds available to pay the network fee.'));
            return cb('no_funds');
          }

          tx.sendMaxInfo = sendMaxInfo;
          tx.toAmount = tx.sendMaxInfo.amount;
          updateAmount();
          showSendMaxWarning(sendMaxInfo, networkURI);
        }

        // txp already generated for this wallet?
        if (tx.txp[wallet.id]) {
          refresh();
          return cb();
        }

        getTxp(lodash.clone(tx), wallet, opts.dryRun, function(err, txp) {
          if (err) return cb(err);

          txp.feeStr = txFormatService.formatAmountStr(networkURI, txp.fee);
          txFormatService.formatAlternativeStr(networkURI, txp.fee, function(v) {
            txp.alternativeFeeStr = v;
          });

          var per = (txp.fee / (txp.amount + txp.fee) * 100);
          txp.feeRatePerStr = per.toFixed(2) + '%';
          txp.feeTooHigh = per > FEE_TOO_HIGH_LIMIT_PER;

          tx.txp[wallet.id] = txp;
          $log.debug('Confirm. TX Fully Updated for wallet:' + wallet.id, tx);
          refresh();

          return cb();
        });
      });
    });
  }

  function useSelectedWallet() {
    if (!$scope.useSendMax) {
      showAmount(tx.toAmount);
    }

    $scope.onWalletSelect($scope.wallet);
  }

  function setButtonText(isMultisig, isPayPro) {
    $scope.buttonText = isCordova ? gettextCatalog.getString('slide') + ' ' : gettextCatalog.getString('Click') + ' ';

    if (isPayPro) {
      $scope.buttonText += gettextCatalog.getString('to pay');
    } else if (isMultisig) {
      $scope.buttonText += gettextCatalog.getString('to accept');
    } else
      $scope.buttonText += gettextCatalog.getString('to send');
  };

  $scope.toggleAddress = function() {
    $scope.showAddress = !$scope.showAddress;
  };

  function showSendMaxWarning(sendMaxInfo, networkURI) {
    function verifyExcludedUtxos() {
      var warningMsg = [];
      if (sendMaxInfo.utxosBelowFee > 0) {
        warningMsg.push(gettextCatalog.getString('A total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.', {
          amountBelowFeeStr: txFormatService.formatAmountStr(networkURI, sendMaxInfo.amountBelowFee)
        }));
      }

      if (sendMaxInfo.utxosAboveMaxSize > 0) {
        warningMsg.push(gettextCatalog.getString('A total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded.', {
          amountAboveMaxSizeStr: txFormatService.formatAmountStr(networkURI, sendMaxInfo.amountAboveMaxSize)
        }));
      }
      return warningMsg.join('\n');
    };

    var msg = gettextCatalog.getString('{{fee}} will be deducted for networking fees.', {
      fee: txFormatService.formatAmountStr(networkURI, sendMaxInfo.fee)
    });
    var warningMsg = verifyExcludedUtxos();

    if (!lodash.isEmpty(warningMsg)) {
      msg += '\n' + warningMsg;
    }

    popupService.showAlert(gettextCatalog.getString('Excluded Funds'), msg);
  };

  $scope.onWalletSelect = function(wallet) {
    setWallet(wallet, tx);
  };

  $scope.showDescriptionPopup = function(tx) {
    var message = gettextCatalog.getString('Set Memo');
    var opts = {
      defaultText: tx.description
    };

    popupService.showPrompt(message, null, opts, function(res) {
      if (typeof res != 'undefined') tx.description = res;
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  function _paymentTimeControl(expirationTime) {
    $scope.paymentExpired = false;
    setExpirationTime();

    countDown = $interval(function() {
      setExpirationTime();
    }, 1000);

    function setExpirationTime() {
      var now = Math.floor(Date.now() / 1000);

      if (now > expirationTime) {
        setExpiredValues();
        return;
      }

      var totalSecs = expirationTime - now;
      var m = Math.floor(totalSecs / 60);
      var s = totalSecs % 60;
      $scope.remainingTimeStr = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    };

    function setExpiredValues() {
      $scope.paymentExpired = true;
      $scope.remainingTimeStr = gettextCatalog.getString('Expired');
      if (countDown) $interval.cancel(countDown);
      $timeout(function() {
        $scope.$apply();
      });
    };
  };

  // Sets a wallet on the UI, creates a TXPs for that wallet.
  function setWallet(wallet, tx) {
    if ($scope.wallet === wallet) {
      return;
    }
    $scope.wallet = wallet;

    setButtonText(wallet.credentials.m > 1, !!tx.paypro);

    if (tx.paypro) {
      _paymentTimeControl(tx.paypro.expires);
    }

    updateTx(tx, wallet, {
      dryRun: true
    }, function(err) {
      $timeout(function() {
        $ionicScrollDelegate.resize();
        $scope.$apply();
      }, 10);
    });
  };

  var setSendError = function(msg) {
    $scope.sendStatus = '';
    $timeout(function() {
      $scope.$apply();
    });
    popupService.showAlert(gettextCatalog.getString('Error at confirm'), walletClientError.msg(msg));
  };

  $scope.openPPModal = function() {
    $ionicModal.fromTemplateUrl('views/modals/paypro.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.payproModal = modal;
      $scope.payproModal.show();
    });
  };

  $scope.cancel = function() {
    $scope.payproModal.hide();
  };

  $scope.approve = function(tx, wallet, onSendStatusChange) {
    if (!tx || !wallet) return;

    if ($scope.paymentExpired) {
      popupService.showAlert(null, gettextCatalog.getString('This payment request has expired.'));
      $scope.sendStatus = '';
      $timeout(function() {
        $scope.$apply();
      });
      return;
    }

    ongoingProcess.set('creatingTx', true, onSendStatusChange);
    getTxp(lodash.clone(tx), wallet, false, function(err, txp) {
      ongoingProcess.set('creatingTx', false, onSendStatusChange);
      if (err) return;

      // confirm txs for more that 20usd, if not spending/touchid is enabled
      function confirmTx(cb) {
        if (walletService.isEncrypted(wallet))
          return cb();

        var amountUsd = parseFloat(txFormatService.formatToUSD(wallet.networkURI, txp.amount));
        if (amountUsd <= CONFIRM_LIMIT_USD)
          return cb();

        var message = gettextCatalog.getString('Sending {{amountStr}} from your {{name}} wallet', {
          amountStr: tx.amountStr,
          name: wallet.name
        });
        var okText = gettextCatalog.getString('Confirm');
        var cancelText = gettextCatalog.getString('Cancel');
        popupService.showConfirm(null, message, okText, cancelText, function(ok) {
          return cb(!ok);
        });
      };

      function publishAndSign() {
        if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
          $log.info('No signing proposal: No private key');

          return walletService.onlyPublish(wallet, txp, function(err) {
            if (err) setSendError(err);
          }, onSendStatusChange);
        }

        walletService.publishAndSign(wallet, txp, function(err, txp) {
          if (err) return setSendError(err);
          if (config.confirmedTxsNotifications && config.confirmedTxsNotifications.enabled) {
            txConfirmNotification.subscribe(wallet, {
              txid: txp.txid
            });
          }
        }, onSendStatusChange);
      };

      confirmTx(function(nok) {
        if (nok) {
          $scope.sendStatus = '';
          $timeout(function() {
            $scope.$apply();
          });
          return;
        }
        publishAndSign();
      });
    });
  };

  function statusChangeHandler(processName, showName, isOn) {
    $log.debug('statusChangeHandler: ', processName, showName, isOn);
    if (
      (
        processName === 'broadcastingTx' ||
        ((processName === 'signingTx') && $scope.wallet.m > 1) ||
        (processName == 'sendingTx' && !$scope.wallet.canSign() && !$scope.wallet.isPrivKeyExternal())
      ) && !isOn) {
      $scope.sendStatus = 'success';
      $timeout(function() {
        $scope.$digest();
      }, 100);
    } else if (showName) {
      $scope.sendStatus = showName;
    }
  };

  $scope.statusChangeHandler = statusChangeHandler;

  $scope.onSuccessConfirm = function() {
    $scope.sendStatus = '';
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      historyRoot: true
    });
    $state.go('tabs.send').then(function() {
      $ionicHistory.clearHistory();
      $state.transitionTo('tabs.home');
    });
  };

  $scope.chooseFeeLevel = function(tx, wallet) {
    var scope = $rootScope.$new(true);
    scope.networkURI = tx.networkURI;
    scope.feeLevel = tx.feeLevel;
    scope.noSave = true;

    if (usingCustomFee) {
      scope.customFeePerKB = tx.feeRate;
      scope.feePerAtomicByte = tx.feeRate / 1000;
    }

    $ionicModal.fromTemplateUrl('views/modals/chooseFeeLevel.html', {
      scope: scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      scope.chooseFeeLevelModal = modal;
      scope.chooseFeeLevelModal.show();
    });

    scope.hideModal = function(newFeeLevel, customFeePerKB) {
      scope.chooseFeeLevelModal.hide();

      // Wait for the modal to finish close transition, the next steps may try to open a popup
      // during the modal close transition which results in locking out the UI.
      $timeout(function(){
        $log.debug('New fee level choosen:' + newFeeLevel + ' was:' + tx.feeLevel);

        usingCustomFee = newFeeLevel == 'custom' ? true : false;

        if (tx.feeLevel == newFeeLevel && !usingCustomFee) return;

        tx.feeLevel = newFeeLevel;
        if (usingCustomFee) tx.feeRate = parseInt(customFeePerKB);

        updateTx(tx, wallet, {
          clearCache: true,
          dryRun: true
        }, function() {});
      }, 300);
    };
  };

});
