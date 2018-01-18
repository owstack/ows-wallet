'use strict';

angular.module('owsWalletApp.controllers').controller('walletDetailsController', function($scope, $rootScope, $interval, $timeout, $filter, $log, $ionicModal, $ionicPopover, $state, $stateParams, $ionicHistory, profileService, lodash, configService, platformInfo, walletService, txpModalService, externalLinkService, popupService, addressbookService, storageService, $ionicScrollDelegate, $window, walletClientError, gettextCatalog, timeService, feeService, appConfigService, networkService, $ionicViewSwitcher) {

  var HISTORY_SHOW_LIMIT = 10;
  var currentTxHistoryPage = 0;
  var listeners = [];
  $scope.txps = [];
  $scope.completeTxHistory = [];
  $scope.openTxpModal = txpModalService.open;
  $scope.isCordova = platformInfo.isCordova;
  $scope.isAndroid = platformInfo.isAndroid;
  $scope.isIOS = platformInfo.isIOS;

  $scope.amountIsCollapsible = !$scope.isAndroid;

  $scope.openExternalLink = function(url, target) {
    externalLinkService.open(url, target);
  };

  var setPendingTxps = function(txps) {

    /* Uncomment to test multiple outputs */

    // var txp = {
    //   message: 'test multi-output',
    //   fee: 1000,
    //   createdOn: new Date() / 1000,
    //   outputs: [],
    //   wallet: $scope.wallet
    // };
    //
    // function addOutput(n) {
    //   txp.outputs.push({
    //     amount: 600,
    //     toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
    //     message: 'output #' + (Number(n) + 1)
    //   });
    // };
    // lodash.times(15, addOutput);
    // txps.push(txp);

    if (!txps) {
      $scope.txps = [];
      return;
    }
    $scope.txps = lodash.sortBy(txps, 'createdOn').reverse();
  };

  $scope.isLivenet = function(networkURI) {
    return networkService.isLivenet(networkURI);
  };

  $scope.isTestnet = function(networkURI) {
    return networkService.isTestnet(networkURI);
  };

  var analyzeUtxosDone;

  var analyzeUtxos = function() {
    if (analyzeUtxosDone) return;

    walletService.getLowUtxos($scope.wallet, function(err, resp) {
      if (err || !resp) return;
      analyzeUtxosDone = true;
      $scope.lowUtxosWarning = resp.warning;
    });
  };

  var updateStatus = function(force) {
    $scope.updatingStatus = true;
    $scope.updateStatusError = null;
    $scope.walletNotRegistered = false;

    walletService.getStatus($scope.wallet, {
      force: !!force,
    }, function(err, status) {
      $scope.updatingStatus = false;
      if (err) {
        if (err === 'WALLET_NOT_REGISTERED') {
          $scope.walletNotRegistered = true;
        } else {
          $scope.updateStatusError = walletClientError.msg(err, gettextCatalog.getString('Could not update wallet'));
        }
        $scope.status = null;
      } else {
        setPendingTxps(status.pendingTxps);
        $scope.status = status;
      }
      refreshAmountSection();
      $timeout(function() {
        $scope.$apply();
      });

      analyzeUtxos();

    });
  };

  $scope.openSearchModal = function() {
    $scope.color = $scope.wallet.color;
    $scope.isSearching = true;
    $scope.txHistorySearchResults = [];
    $scope.filteredTxHistory = [];

    $ionicModal.fromTemplateUrl('views/modals/search.html', {
      scope: $scope,
      focusFirstInput: true
    }).then(function(modal) {
      $scope.searchModal = modal;
      $scope.searchModal.show();
    });

    $scope.close = function() {
      $scope.isSearching = false;
      $scope.searchModal.hide();
    };

    $scope.openTx = function(tx) {
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $scope.close();
      $scope.openTxModal(tx);
    };
  };

  $scope.openTxModal = function(btx) {
    $scope.btx = lodash.cloneDeep(btx);
    $scope.walletId = $scope.wallet.id;
    $state.transitionTo('tabs.wallet.tx-details', {
      txid: $scope.btx.txid,
      walletId: $scope.walletId
    });
  };

  $scope.openBalanceModal = function() {
    $ionicModal.fromTemplateUrl('views/modals/wallet-balance.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.walletBalanceModal = modal;
      $scope.walletBalanceModal.show();
    });

    $scope.close = function() {
      $scope.walletBalanceModal.hide();
    };
  };

  $scope.recreate = function() {
    walletService.recreate($scope.wallet, function(err) {
      if (err) return;
      $timeout(function() {
        walletService.startScan($scope.wallet, function() {
          $scope.updateAll();
          $scope.$apply();
        });
      });
    });
  };

  var updateTxHistory = function(cb) {
    if (!cb) cb = function() {};
    $scope.updatingTxHistory = true;

    $scope.updateTxHistoryError = false;
    $scope.updatingTxHistoryProgress = 0;

    var progressFn = function(txs, newTxs) {
      if (newTxs > 5) $scope.txHistory = null;
      $scope.updatingTxHistoryProgress = newTxs;
      $timeout(function() {
        $scope.$apply();
      });
    };

    walletService.getTxHistory($scope.wallet, {
      progressFn: progressFn
    }, function(err, txHistory) {
      $scope.updatingTxHistory = false;
      if (err) {
        $scope.txHistory = null;
        $scope.updateTxHistoryError = true;
        return;
      }

      var hasTx = txHistory[0];
      if (hasTx) $scope.showNoTransactionsYetMsg = false;
      else $scope.showNoTransactionsYetMsg = true;

      $scope.completeTxHistory = txHistory;
      $scope.showHistory();
      $timeout(function() {
        $scope.$apply();
      });
      return cb();
    });
  };

  $scope.showHistory = function() {
    if ($scope.completeTxHistory) {
      $scope.txHistory = $scope.completeTxHistory.slice(0, (currentTxHistoryPage + 1) * HISTORY_SHOW_LIMIT);
      $scope.txHistoryShowMore = $scope.completeTxHistory.length > $scope.txHistory.length;
    }
  };

  $scope.getDate = function(txCreated) {
    var date = new Date(txCreated * 1000);
    return date;
  };

  $scope.isFirstInGroup = function(index) {
    if (index === 0) {
      return true;
    }
    var curTx = $scope.txHistory[index];
    var prevTx = $scope.txHistory[index - 1];
    return !$scope.createdDuringSameMonth(curTx, prevTx);
  };

  $scope.isLastInGroup = function(index) {
    if (index === $scope.txHistory.length - 1) {
      return true;
    }
    return $scope.isFirstInGroup(index + 1);
  };

  $scope.createdDuringSameMonth = function(curTx, prevTx) {
    return timeService.withinSameMonth(curTx.time * 1000, prevTx.time * 1000);
  };

  $scope.createdWithinPastDay = function(time) {
    return timeService.withinPastDay(time);
  };

  $scope.isDateInCurrentMonth = function(date) {
    return timeService.isDateInCurrentMonth(date);
  };

  $scope.isUnconfirmed = function(tx) {
    return !tx.confirmations || tx.confirmations === 0;
  };

  $scope.showMore = function() {
    $timeout(function() {
      currentTxHistoryPage++;
      $scope.showHistory();
      $scope.$broadcast('scroll.infiniteScrollComplete');
    }, 100);
  };

  $scope.onRefresh = function() {
    $timeout(function() {
      $scope.$broadcast('scroll.refreshComplete');
    }, 300);
    $scope.updateAll(true);
  };

  $scope.updateAll = function(force, cb)  {
    updateStatus(force);
    updateTxHistory(cb);
  };

  $scope.hideToggle = function() {
    profileService.toggleHideBalanceFlag($scope.wallet.credentials.walletId, function(err) {
      if (err) $log.error(err);
    });
  };

  var prevPos;

  function getScrollPosition() {
    var scrollPosition = $ionicScrollDelegate.getScrollPosition();
    if (!scrollPosition) {
      $window.requestAnimationFrame(function() {
        getScrollPosition();
      });
      return;
    }
    var pos = scrollPosition.top;
    if (pos === prevPos) {
      $window.requestAnimationFrame(function() {
        getScrollPosition();
      });
      return;
    }
    prevPos = pos;
    refreshAmountSection(pos);
  };

  function refreshAmountSection(scrollPos) {
    if ($scope.status) {
      $scope.showBalanceButton = ($scope.status.totalBalanceAtomic != $scope.status.spendableAmount);
    } else {
      $scope.showBalanceButton = false;
    }

    // If the amount header is not collapsible then set the top of the amount balance.
    if (!$scope.amountIsCollapsible) {
      var t = ($scope.showBalanceButton ? 15 : 45);
      $scope.amountScale = 'translateY(' + t + 'px)';
      return;
    }

    scrollPos = scrollPos || 0;

    var AMOUNT_HEADER_MAX_HEIGHT = 210;
    var AMOUNT_HEADER_MIN_HEIGHT = 80;

    // Set smallest collapsed amount header height.
    var amountHeight = AMOUNT_HEADER_MAX_HEIGHT - scrollPos;
    if (amountHeight < AMOUNT_HEADER_MIN_HEIGHT) {
      amountHeight = AMOUNT_HEADER_MIN_HEIGHT;
    }

    // Set the top of the view content below the amount header.
    var contentMargin = amountHeight;
    if (contentMargin > AMOUNT_HEADER_MAX_HEIGHT) {
      contentMargin = AMOUNT_HEADER_MAX_HEIGHT;
    }

    // Set the scaled size of the amount header content based on current amount header height.
    var amountScale = (amountHeight / AMOUNT_HEADER_MAX_HEIGHT);
    if (amountScale < 0.5) {
      amountScale = 0.5;
    }
    if (amountScale > 1.1) {
      amountScale = 1.1;
    }

    // Set the top position for the amount balance; make space for the balance button when it needs to display.
    var TOP_NO_BALANCE_BUTTON = 20;
    var TOP_BALANCE_BUTTON = 30;

    var top = TOP_NO_BALANCE_BUTTON;
    if ($scope.showBalanceButton) {
      top = TOP_BALANCE_BUTTON;
    }

    var amountTop = amountScale * top;
//    var amountTop = ((amountScale - 0.7) / 0.7) * top;
//    if (amountTop < -10) {
//      amountTop = -10;
//    }
//    if (amountTop > top) {
//      amountTop = top;
//    }

    // Vary opacity for elements displayed when amount header is collapsed.
    $scope.elementOpacity = (amountHeight - 100) / 80;

    // Apply results to view.
    $window.requestAnimationFrame(function() {
      $scope.amountHeight = amountHeight + 'px';
      $scope.contentMargin = contentMargin + 'px';
      $scope.amountScale = 'scale3d(' + amountScale + ',' + amountScale + ',' + amountScale + ') translateY(' + amountTop + 'px)';
      $scope.$digest();
      getScrollPosition();
    });
  };

  $scope.sendFrom = function() {
    if ($scope.hasBalance) {
      $state.go('tabs.send', {
        walletId: $scope.walletId
      });
    }
  };

  $scope.receiveTo = function() {
    $state.go('tabs.receive', {
      walletId: $scope.walletId
    });
  };

  $scope.settingsFor = function() {
    $state.transitionTo('tabs.preferencesWallet', {
      walletId: $scope.walletId,
      fromWallet: true
    });
  };
  
  var scrollWatcherInitialized;

  $scope.$on("$ionicView.enter", function(event, data) {
    if ($scope.isCordova && $scope.isAndroid) setAndroidStatusBarColor();
    if (scrollWatcherInitialized || !$scope.amountIsCollapsible) {
      return;
    }
    scrollWatcherInitialized = true;
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    var clearCache = data.stateParams.clearCache;
    $scope.walletId = data.stateParams.walletId;
    $scope.wallet = profileService.getWallet($scope.walletId);
    if (!$scope.wallet) return;
    // Getting info from cache
    if (clearCache) {
      $scope.txHistory = null;
      $scope.status = null;
    } else {
      $scope.status = $scope.wallet.cachedStatus;
      if ($scope.wallet.completeHistory) {
        $scope.completeTxHistory = $scope.wallet.completeHistory;
        $scope.showHistory();
      }
    }

    $scope.requiresMultipleSignatures = $scope.wallet.credentials.m > 1;
    $scope.hasBalance = ($scope.status.spendableAmount > 0);

    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);
      $scope.addressbook = ab || {};
    });

    listeners = [
      $rootScope.$on('walletServiceEvent', function(e, walletId) {
        if (walletId == $scope.wallet.id && e.type != 'NewAddress')
          $scope.updateAll();
      }),
      $rootScope.$on('Local/TxAction', function(e, walletId) {
        if (walletId == $scope.wallet.id)
          $scope.updateAll();
      }),
    ];
  });

  $scope.$on("$ionicView.afterEnter", function(event, data) {
    $scope.updateAll();
    refreshAmountSection();
  });

  $scope.$on("$ionicView.afterLeave", function(event, data) {
    if ($window.StatusBar) {
      var statusBarColor = '#192c3a';
      $window.StatusBar.backgroundColorByHexString(statusBarColor);
    }
  });

  $scope.$on("$ionicView.leave", function(event, data) {
    lodash.each(listeners, function(x) {
      x();
    });
  });

  function setAndroidStatusBarColor() {
    var SUBTRACT_AMOUNT = 15;
    var rgb = hexToRgb($scope.wallet.color);
    var keys = Object.keys(rgb);
    keys.forEach(function(k) {
      if (rgb[k] - SUBTRACT_AMOUNT < 0) {
        rgb[k] = 0;
      } else {
        rgb[k] -= SUBTRACT_AMOUNT;
      }
    });
    var statusBarColorHexString = rgbToHex(rgb.r, rgb.g, rgb.b);
    if ($window.StatusBar)
      $window.StatusBar.backgroundColorByHexString(statusBarColorHexString);
  }

  function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
});
