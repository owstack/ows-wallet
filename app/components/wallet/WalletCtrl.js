'use strict';

angular.module('owsWalletApp.controllers').controller('WalletCtrl', function($scope, $rootScope, $interval, $timeout, $log, $ionicModal, $ionicPopover, $state, $ionicHistory, profileService, lodash, platformInfoService, walletService, txpModalService, externalLinkService, addressBookService, $ionicScrollDelegate, $window, walletClientErrorService, gettextCatalog, timeService, networkService, helpService, uiService) {

  // Constants for managing collapsible view.
  var NAV_BAR_HEIGHT = 44; // app nav bar content height
  var CONTENT_INSET_TOP = uiService.getSafeAreaInsets().top + NAV_BAR_HEIGHT;
  var CONTENT_INSET_BOTTOM = uiService.getSafeAreaInsets().bottom;
  var HEADER_MAX_HEIGHT = 165; // Maximum total height of header
  var HEADER_MIN_HEIGHT = 44; // Minimum (collapsed) height of header
  var HEADER_TOP = 20; // Initial top position of the scaled content inside the header
  var HEADER_TOP_FINAL = 15; // Final top position of the scaled content inside the header
  var HEADER_CONTENT_MIN_SCALE = 0.5; // Smallest scaling of fullsize content
  var PADDING_MAX = $window.screen.height - CONTENT_INSET_TOP - HEADER_MIN_HEIGHT; // The most padding necessary to allow for header collapse when there is no wallet content.

  var lastScrollPos = undefined;

  var HISTORY_SHOW_LIMIT = 10;
  var currentTxHistoryPage = 0;
  var listeners = [];

  $scope.txps = [];
  $scope.completeTxHistory = [];
  $scope.openTxpModal = txpModalService.open;
  $scope.isCordova = platformInfoService.isCordova;
  $scope.isAndroid = platformInfoService.isAndroid;
  $scope.isIOS = platformInfoService.isIOS;
  $scope.headerIsCollapsible = !$scope.isAndroid;

  $scope.$on("$ionicView.enter", function(event, data) {
    if ($scope.isCordova && $scope.isAndroid) {
      setAndroidStatusBarColor();
    }
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    var clearCache = data.stateParams.clearCache;
    $scope.walletId = data.stateParams.walletId;
    $scope.wallet = profileService.getWallet($scope.walletId);

    if (!$scope.wallet) {
      return;
    }

    // Getting info from cache.
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

    addressBookService.list(function(err, ab) {
      if (err) {
        $log.error(err.message);
      }
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

    $scope.updateAll();
    refreshAmountSection();
  });

  $scope.$on("$ionicView.leave", function(event, data) {
    lodash.each(listeners, function(x) {
      x();
    });
  });

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
          $scope.updateStatusError = {
            message: gettextCatalog.getString('Could not update wallet'),
            detail: walletClientErrorService.msg(err)
          }
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

    $ionicModal.fromTemplateUrl('views/wallet/tx-search/tx-search.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.searchModal = modal;
      $scope.searchModal.show();
    });

    $scope.close = function() {
      $scope.isSearching = false;
      $scope.searchModal.remove();
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
    $state.transitionTo($rootScope.sref('wallet.tx-details'), {
      txid: $scope.btx.txid,
      walletId: $scope.walletId
    });
  };

  $scope.openBalanceModal = function() {
    $ionicModal.fromTemplateUrl('views/wallet/balance/balance.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.walletBalanceModal = modal;
      $scope.walletBalanceModal.show();
    });

    $scope.close = function() {
      $scope.walletBalanceModal.remove();
    };
  };

  $scope.recreate = function() {
    walletService.recreate($scope.wallet, function(err) {
      if (err) {
        return;
      }
      $timeout(function() {
        walletService.startScan($scope.wallet, function() {
          $scope.updateAll();
          $scope.$apply();
        });
      });
    });
  };

  var updateTxHistory = function(cb) {
    if (!cb) {
      cb = function() {};
    }
    $scope.updatingTxHistory = true;
    $scope.updateTxHistoryError = false;
    $scope.updatingTxHistoryProgress = 0;

    var progressFn = function(txs, newTxs) {
      if (newTxs > 5) {
        $scope.txHistory = null;
      }
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
      if (err) {
        $log.error(err);
      }
    });
  };

  var prevPos;

  $scope.getScrollPosition = function() {
    var position = $ionicScrollDelegate.$getByHandle('walletScroll').getScrollPosition().top;
    refreshAmountSection(position);
  };

  function refreshAmountSection(scrollPos) {
    if (!$scope.headerIsCollapsible) {
      return;
    }

    if (scrollPos == undefined && lastScrollPos == undefined) {
      lastScrollPos = 0;
    }

    function outerHeight(el) {
      var height = el.offsetHeight;
      var style = getComputedStyle(el);

      height -= parseInt(style.paddingBottom);
      height += parseInt(style.marginTop) + parseInt(style.marginBottom);
      return height;
    };

    if ($scope.status) {
      $scope.showAvailableBalance = ($scope.status.totalBalanceAtomic != $scope.status.spendableAmount);
    } else {
      $scope.showAvailableBalance = false;
    }

    scrollPos = scrollPos || lastScrollPos;
    lastScrollPos = scrollPos;

    // Set collapsed header height.
    var collapsibleItemHeight = HEADER_MAX_HEIGHT - scrollPos;
    if (collapsibleItemHeight < HEADER_MIN_HEIGHT) {
      collapsibleItemHeight = HEADER_MIN_HEIGHT;
    }
    if (collapsibleItemHeight > HEADER_MAX_HEIGHT) {
      collapsibleItemHeight = HEADER_MAX_HEIGHT;
    }

    // Calculate percentage collapsed.
    $scope.collapsibleItemPercent = (collapsibleItemHeight - HEADER_MIN_HEIGHT) / (HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT);

    // Set the scaled size of the header content based on current scale.
    var collapsibleItemContentScale = HEADER_CONTENT_MIN_SCALE + ($scope.collapsibleItemPercent * (1 - HEADER_CONTENT_MIN_SCALE));

    // Set the top of the view content below the header.
    var contentMargin = collapsibleItemHeight;

    // Set the top position for the header.
    var headerTop = HEADER_TOP_FINAL + ($scope.collapsibleItemPercent * Math.abs(HEADER_TOP_FINAL - HEADER_TOP));

    // Vary opacity for elements displayed when header is collapsed.
    $scope.elementOpacity = $scope.collapsibleItemPercent;
    $scope.elementOpacityInverse = 1 - $scope.elementOpacity;

    // Compute the amount of bottom padding needed to allow content that does not fill the view to collapse the header.
    var contentPaddingBottom = PADDING_MAX - outerHeight(document.getElementsByClassName('scrollable-wallet-content')[0]);
    if (contentPaddingBottom < 0) {
      contentPaddingBottom = 0;
    }

    // Apply results to view.
    $window.requestAnimationFrame(function() {
      $scope.collapsibleItemHeight = collapsibleItemHeight + 'px';
      $scope.contentHeight = $window.screen.height - CONTENT_INSET_TOP - contentMargin + 'px';

      // Apply bottom margin to the scroll container to prevent the scroll container from moving down on resize events (margin takes up the space).
      // Only apply if the content is larger than the visible space.
      if (outerHeight(document.getElementsByClassName('scrollable-wallet-content')[0]) >= parseInt($scope.contentHeight)) {
        document.querySelector('.ion-content-wallet .scroll').style.marginBottom = HEADER_MAX_HEIGHT + 'px';
      }
  
      $scope.contentMargin = contentMargin + 'px';
      $scope.contentTransform = 'translateY(' + (HEADER_MAX_HEIGHT - collapsibleItemHeight) + 'px)';
      $scope.collapsibleItemScale = 'scale3d(' + collapsibleItemContentScale + ',' + collapsibleItemContentScale + ',' + collapsibleItemContentScale + ') translateY(' + headerTop + 'px)';
      $scope.isCollapsing = collapsibleItemHeight < HEADER_MAX_HEIGHT;
      $scope.contentPaddingBottom = contentPaddingBottom + 'px';
      $scope.$digest();
    });
  };

  $scope.learnMore = function() {
    // TODO-AJP:
    var locationPrefix = 'tbd';
    var topicId = 'tbd';
    helpService.learnMore($scope, locationPrefix, topicId);
  };

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
