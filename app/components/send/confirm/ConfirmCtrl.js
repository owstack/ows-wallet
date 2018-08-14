'use strict';

angular.module('owsWalletApp.controllers').controller('ConfirmCtrl', function($rootScope, $scope, $timeout, $ionicScrollDelegate, gettextCatalog, walletService, platformInfoService, lodash, configService, $state, $log, profileService, $ionicModal, popupService, $ionicHistory, $ionicConfig, walletClientErrorService, networkService, txConfirmNotificationService, Transaction) {

  var config = configService.getSync();
  var isCordova = platformInfoService.isCordova;

  var tx;

  $scope.$on("$ionicView.beforeLeave", function(event, data) {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    $ionicConfig.views.swipeBackEnabled(false);
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    function setWalletSelector(networkURI, minAmount, cb) {
      // no min amount? (sendMax) => look for no empty wallets
      minAmount = minAmount || 1;

      $scope.wallets = profileService.getWallets({
        onlyComplete: true,
        networkURI: networkURI
      });

      if (!$scope.wallets || !$scope.wallets.length) {
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

            if (status.availableBalanceAtomic > minAmount) {
              filteredWallets.push(w);
            }
          }

          if (++index == $scope.wallets.length) {
            if (!walletsUpdated) {
              return cb('Could not update any wallet');
            }

            $scope.wallets = lodash.clone(filteredWallets);
            return cb();
          }
        });
      });
    };

    // The wallet originating the send request.
    var desiredWalletId = data.stateParams.walletId;
    
    $scope.isCordova = isCordova;
    $scope.showAddress = false;
    $scope.paymentExpired = false;
    $scope.walletSelectorTitle = gettextCatalog.getString('Send from');

    // Create the private transaction object.
    var txData = {
      // Core properties.
      toAddress: data.stateParams.toAddress,
      toAmount: parseInt(data.stateParams.toAmount),
      useSendMax: data.stateParams.useSendMax == 'true' ? true : false,
      paypro: data.stateParams.paypro,
      feeLevel: config.currencyNetworks[data.stateParams.networkURI].feeLevel,
      networkURI: data.stateParams.networkURI,

      // Additional properties.
      description: data.stateParams.description,
      spendUnconfirmed: config.wallet.spendUnconfirmed,

      // Supporting data not part of the final transaction.
      currency: networkService.getNetworkByURI(data.stateParams.networkURI).currency,
      recipientType: data.stateParams.recipientType || null,
      toName: data.stateParams.toName,
      toEmail: data.stateParams.toEmail,
      toColor: data.stateParams.toColor
    };

    tx = new Transaction(txData);

    // Expose the transaction to the UI.
    $scope.tx = tx;

    // Set payment expiration time if payment protocol is in use.
    if (tx.paypro) {
      paymentTimeControl(tx.paypro.expires);
    }

    // Set a wallet or show the wallet selector.
    setWalletSelector(tx.networkURI, tx.toAmount, function(err) {
      if (err) {
        return exitWithError('Could not update wallets');
      }

      if ($scope.wallets.length == 0) {

        popupService.showAlert(
          gettextCatalog.getString('Insufficient Funds'),
          gettextCatalog.getString('There are no wallets available to make a payment.'));

      } else if (!desiredWalletId) {

        // Either show the wallet selector or choose the one wallet found.
        if ($scope.wallets.length > 1) {
          $scope.showWalletSelector();
        } else if ($scope.wallets.length) {
          setWallet($scope.wallets[0], tx);
        }

      } else {

        // Desired wallet is set.
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
            popupService.showAlert(
              gettextCatalog.getString('Insufficient Funds'),
              gettextCatalog.getString('Cannot make payment from selected wallet.'));
          }
          setWallet($scope.wallets[0], tx);
        }
      }
    });

  });

  $scope.showWalletSelector = function() {
    $scope.walletSelector = true;

    $timeout(function() {
      $scope.$apply();
    }, 1);
  };

  $scope.toggleAddress = function() {
    $scope.showAddress = !$scope.showAddress;
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

  $scope.onToItemClick = function() {
    function openPPModal() {
      $ionicModal.fromTemplateUrl('views/send/confirm/payment-protocol/payment-protocol.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.payproModal = modal;
        $scope.payproModal.show();
      });
    };

    if (tx.paypro) {
      openPPModal();
    }
  };

  $scope.cancel = function() {
    $scope.payproModal.remove();
  };

  $scope.send = function() {
    if (tx.shouldConfirm) {

      var message = gettextCatalog.getString('Sending {{amountStr}} from your {{name}} wallet.', {
        amountStr: tx.amountStr,
        name: tx.getWallet().name
      });
      var title = gettextCatalog.getString('Confirm Transaction');
      var okText = gettextCatalog.getString('Confirm');
      var cancelText = gettextCatalog.getString('Cancel');

      popupService.showConfirm(title, message, okText, cancelText, function(ok) {
        if (!ok) {
          $scope.sendStatus = '';
        }

        tx.send(function(err) {
          if (err) {
            setSendError(err);
          }
        }, statusChangeHandler);
      });

    } else {

      tx.send(function(err) {
        if (err) {
          setSendError(err);
        }
      }, statusChangeHandler);
    }
  };

  $scope.onSuccessConfirm = function() {
    $scope.sendStatus = '';
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      historyRoot: true
    });
    $state.go($rootScope.sref('send')).then(function() {
      $ionicHistory.clearHistory();
      $state.transitionTo($rootScope.sref('home'));
    });
  };

  $scope.chooseFeeLevel = function(tx) {
    var scope = $rootScope.$new(true);
    scope.networkURI = tx.networkURI;
    scope.feeLevel = tx.feeLevel;
    scope.noSave = true;

    if (tx.usingCustomFee) {
      scope.customFeePerKB = tx.feePerKb;
      scope.feePerAtomicByte = tx.feePerKb / 1000;
    }

    $ionicModal.fromTemplateUrl('views/send/choose-fee-level/choose-fee-level.html', {
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

        tx.usingCustomFee = newFeeLevel == 'custom' ? true : false;

        if (tx.feeLevel == newFeeLevel && !tx.usingCustomFee) {
          return;
        }

        var rate;
        if (tx.usingCustomFee) {
          rate = parseInt(customFeePerKB);
        }

        tx.setFee(newFeeLevel, rate, tx.usingCustomFee, function(err) {
          if (err) {
            setSendError(err);
          }
          $timeout(function() {
            $scope.$apply();
          });
        });

      }, 300);
    };
  };

  function exitWithError(err) {
    $log.error('Error setting wallet selector:' + err);
    popupService.showAlert(gettextCatalog.getString('Wallet Error'), walletClientErrorService.msg(err), function() {
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        historyRoot: true
      });
      $ionicHistory.clearHistory();
      $state.go($rootScope.sref('send'));
    });
  };

  // Sets a wallet on the UI, creates a TXPs for that wallet.
  function setWallet(wallet) {
    if ($scope.wallet === wallet) {
      return;
    }

    $scope.wallet = wallet;
    setButtonText(wallet.credentials.m > 1, !!tx.paypro);

    tx.setWallet(wallet, function(err) {
      if (err) {
        setSendError(err);
      }

      // If the transaction has been set to use all of the wallets funds then show the user the asscoiated fee.
      if (tx.useSendMax) {
        showSendMaxWarning(tx);
      }

      $timeout(function() {
        $ionicScrollDelegate.resize();
        $scope.$apply();
      }, 10);
    });
  };

  function statusChangeHandler(data) {
    if (
      (
        data.processName === 'broadcastingTx' ||
        ((data.processName === 'signingTx') && $scope.wallet.m > 1) ||
        (data.processName == 'sendingTx' && !$scope.wallet.canSign() && !$scope.wallet.isPrivKeyExternal())
      ) && !data.isOn) {
      $scope.sendStatus = 'success';

      $timeout(function() {
        $scope.$digest();
      }, 100);

    } else if (data.showName) {
      $scope.sendStatus = data.showName;

      $timeout(function() {
        $scope.$apply();
      });
    }
  };

  // Keeps track of payment expiration time.
  function paymentTimeControl(expirationTime) {
    setExpirationTime();

    countdown = $interval(function() {
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
      if (countdown) {
        $interval.cancel(countdown);
      }
    };
  };

  function setSendError(msg) {
    $scope.sendStatus = '';
    $timeout(function() {
      $scope.$apply();
    });
    popupService.showAlert(gettextCatalog.getString('Error at confirm'), walletClientErrorService.msg(msg));
  };

  function setButtonText(isMultisig, isPayPro) {
    $scope.buttonText = isCordova ? gettextCatalog.getString('Slide') + ' ' : gettextCatalog.getString('Click') + ' ';

    if (isPayPro) {
      $scope.buttonText += gettextCatalog.getString('to pay');
    } else if (isMultisig) {
      $scope.buttonText += gettextCatalog.getString('to accept');
    } else
      $scope.buttonText += gettextCatalog.getString('to send');
  };

  function showSendMaxWarning(tx) {
    function verifyExcludedUtxos() {
      var warningMsg = [];
      if (tx.utxosBelowFee > 0) {
        warningMsg.push(gettextCatalog.getString('A total of {{amountBelowFeeStr}} was excluded. These funds come from UTXOs smaller than the network fee provided.', {
          amountBelowFeeStr: tx.amountBelowFeeStr
        }));
      }

      if (tx.utxosAboveMaxSize > 0) {
        warningMsg.push(gettextCatalog.getString('A total of {{amountAboveMaxSizeStr}} was excluded. The maximum size allowed for a transaction was exceeded.', {
          amountAboveMaxSizeStr: tx.amountAboveMaxSizeStr
        }));
      }
      return warningMsg.join('\n');
    };

    var msg = gettextCatalog.getString('{{fee}} will be deducted for network fees.', {
      fee: tx.feeStr
    });
    var warningMsg = verifyExcludedUtxos();

    if (!lodash.isEmpty(warningMsg)) {
      msg += '\n' + warningMsg;
    }

    popupService.showAlert(gettextCatalog.getString('Network Fee'), msg);
  };

});
