'use strict';

angular.module('owsWalletApp.controllers').controller('HomeCtrl',
  function($rootScope, $timeout, $scope, $state, $stateParams, $ionicScrollDelegate, $window, gettextCatalog, lodash, popupService, ongoingProcessService, externalLinkService, latestReleaseService, profileService, walletService, configService, $log, platformInfoService, storageService, txpModalService, appConfig, startupService, addressBookService, feedbackService, walletClientErrorService, pushNotificationsService, timeService, networkService, uiService, appletService) {
    var wallet;
    var listeners = [];
    var notifications = [];

    $scope.openTxpModal = txpModalService.open;
    $scope.version = $window.version;
    $scope.name = appConfig.nameCase;
    $scope.tipNewRelease = false;
    $scope.tipRateApp = false;
    $scope.tipWalletReady = $stateParams.fromOnboarding;

    $scope.isCordova = platformInfoService.isCordova;
    $scope.isAndroid = platformInfoService.isAndroid;
    $scope.isNW = platformInfoService.isNW;

    $scope.layout = {
      current: 'list',
      next: 'grid'
    };

    $scope.walletSlides = {
      activeIndex: 0,
      previousIndex: null,
      slider: {},
      options: {
        freeMode: true,
        freeModeSticky: true,
        pagination: {
          el: null
        },
        effect: 'slide',
        speed: 300,
        slidesOffsetBefore: 10,
        slidesOffsetAfter: 10,
        spaceBetween: 10,
        slidesPerView: 'auto'
      }
    };

    $scope.$on("$ionicView.afterEnter", function() {
      startupService.ready();
    });

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.shouldShowLogo = $rootScope.usingTabs;

      if (!$scope.tipWalletReady) {
        storageService.getTipWalletReadyAccepted(function(error, value) {
          $scope.tipWalletReady = (value == 'accepted') ? false : true;
        });
      }

      if ($scope.isNW) {
        latestReleaseService.checkLatestRelease(function(err, newRelease) {
          if (err) {
            $log.warn(err);
            return;
          }
          if (newRelease) {
            $scope.tipNewRelease = true;
            $scope.updateText = gettextCatalog.getString('There is a new version of {{appName}} available', {
              appName: $scope.name
            });
          }
        });
      }

      storageService.getFeedbackInfo(function(error, info) {
        if (!info) {
          initFeedBackInfo();
        } else {
          var feedbackInfo = JSON.parse(info);
          //Check if current version is greater than saved version
          var currentVersion = $scope.version;
          var savedVersion = feedbackInfo.version;
          var isVersionUpdated = feedbackService.isVersionUpdated(currentVersion, savedVersion);
          if (!isVersionUpdated) {
            initFeedBackInfo();
            return;
          }
          var now = moment().unix();
          var timeExceeded = (now - feedbackInfo.time) >= 24 * 7 * 60 * 60;
          $scope.tipRateApp = timeExceeded && !feedbackInfo.sent;
          $timeout(function() {
            $scope.$apply();
          });
        }
      });

      function initFeedBackInfo() {
        var feedbackInfo = {};
        feedbackInfo.time = moment().unix();
        feedbackInfo.version = $scope.version;
        feedbackInfo.sent = false;
        storageService.setFeedbackInfo(JSON.stringify(feedbackInfo), function() {
          $scope.tipRateApp = false;
        });
      };
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      updateAllWallets();
      updateAllApplets();

      addressBookService.list(function(err, ab) {
        if (err) {
          $log.error(err.message);
        }
        $scope.addressbook = ab || {};
      });

      listeners = [
        $rootScope.$on('walletServiceEvent', function(e, walletId, type, n) {
          var wallet = profileService.getWallet(walletId);
          updateWallet(wallet);
          if ($scope.recentTransactionsEnabled) {
            getNotifications();
          }

        }),
        $rootScope.$on('Local/TxAction', function(e, walletId) {
          $log.debug('Got action for wallet ' + walletId);
          var wallet = profileService.getWallet(walletId);
          updateWallet(wallet);
          if ($scope.recentTransactionsEnabled) {
            getNotifications(); 
          }
        })
      ];

      configService.whenAvailable(function(config) {
        $scope.recentTransactionsEnabled = config.recentTransactions.enabled;
        if ($scope.recentTransactionsEnabled) {
          getNotifications();
        }

        if (config.hideApplets.enabled) {
          $scope.applets = null;
        } else {
          $scope.applets = appletService.getAppletsWithStateSync();
        }

        pushNotificationsService.init();

        $scope.showLayoutButton = config.experiments.walletLayout.enabled;

        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 200); // Enough time for the tab bar to animate in
      });
    });

    $scope.$on("$ionicView.leave", function(event, data) {
      lodash.each(listeners, function(x) {
        x();
      });
    });

    $scope.createdWithinPastDay = function(time) {
      return timeService.withinPastDay(time);
    };

    $scope.openExternalLinkDownload = function() {
      var url = appConfig.gitHubRepoUrl + '/releases/latest';
      var optIn = true;
      var title = gettextCatalog.getString('Update Available');
      var message = gettextCatalog.getString('An update to this app is available. For your security, please update to the latest version.');
      var okText = gettextCatalog.getString('View Update');
      var cancelText = gettextCatalog.getString('Go Back');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };

    $scope.openNotificationModal = function(n) {
      wallet = profileService.getWallet(n.walletId);

      if (n.txid) {
        $state.transitionTo($rootScope.sref('wallet.tx-details'), {
          txid: n.txid,
          walletId: n.walletId
        });
      } else {
        var txp = lodash.find($scope.txps, {
          id: n.txpId
        });
        if (txp) {
          txpModalService.open(txp);
        } else {
          ongoingProcessService.set('loadingTxInfo', true);
          walletService.getTxp(wallet, n.txpId, function(err, txp) {
            var _txp = txp;
            ongoingProcessService.set('loadingTxInfo', false);
            if (err) {
              $log.warn('No txp found');
              return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Transaction not found.'));
            }
            txpModalService.open(_txp);
          });
        }
      }
    };

    $scope.openWallet = function(wallet) {
      if (!wallet.isComplete()) {
        return $state.go($rootScope.sref('copayers'), {
          walletId: wallet.credentials.walletId
        });
      }

      $state.go($rootScope.sref('wallet'), {
        walletId: wallet.credentials.walletId
      });
    };

    $scope.goToAddWallet = function() {
      $state.go($rootScope.sref('add'));
    };

    $scope.goToAllWallets = function() {
      $state.go($rootScope.sref('home.all-wallets'), {
        wallets: $scope.wallets,
        openWallet: $scope.openWallet
      });
    };

    var updateTxps = function() {
      profileService.getTxps({
        limit: 3
      }, function(err, txps, n) {
        if (err) $log.error(err);
        $scope.txps = txps;
        $scope.txpsN = n;
        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      })
    };

    var updateAllWalletGroups = function() {
      // Use the collection of wallets to discern all available wallet groups.
      // Create an array of unique wallet groups.
      var groups = lodash.map($scope.wallets, function(wallet) {
        return {
          id: wallet.layout.group.id,
          label: wallet.layout.group.label
        };
      });

      // Guarantee the favorites group is always present in the list.
      groups.push(uiService.newWalletGroup('favorite'));

      groups = lodash.uniq(groups, function(g) {
        return g.id;
      });

      groups = lodash.reject(groups, function(g) {
        return g.id.length == 0;
      });

      // Sort by group label.
      $scope.walletGroups = lodash.sortBy(groups, function(g) {
        return g.label;
      });
    };

    var updateAllApplets = function() {
      $scope.applets = appletService.getAppletsWithStateSync();
    };

    var updateAllWallets = function() {
      $scope.wallets = profileService.getWallets();
      if (lodash.isEmpty($scope.wallets)) {
        return;
      }

      var i = $scope.wallets.length;
      var j = 0;
      var timeSpan = 60 * 60 * 24 * 7;

      lodash.each($scope.wallets, function(wallet) {
        walletService.getStatus(wallet, {}, function(err, status) {
          if (err) {
            wallet.error = (err === 'WALLET_NOT_REGISTERED') ? gettextCatalog.getString('Wallet not registered.') : walletClientErrorService.msg(err, {clean: true});
            $log.error(err);
          } else {
            wallet.error = null;
            wallet.status = status;

            // TODO-AJP: service refactor? not in profile service
            profileService.setLastKnownBalance(wallet.id, wallet.status.totalBalanceStr, function() {});
          }
          if (++j == i) {
            updateTxps();
          }
        });
      });

      updateAllWalletGroups();
    };

    var updateWallet = function(wallet) {
      $log.debug('Updating wallet: ' + wallet.name)
      walletService.getStatus(wallet, {}, function(err, status) {
        if (err) {
          $log.error(err);
          return;
        }
        wallet.status = status;
        updateTxps();
      });
    };

    var getNotifications = function() {
      profileService.getNotifications({
        limit: 3
      }, function(err, notifications, total) {
        if (err) {
          $log.error(err);
          return;
        }
        $scope.notifications = notifications;
        $scope.notificationsN = total;
        $timeout(function() {
          $ionicScrollDelegate.resize();
          $scope.$apply();
        }, 10);
      });
    };

    $scope.hideTipWalletReady = function() {
      storageService.setTipWalletReadyAccepted('accepted', function() {
        $scope.tipWalletReady = false;
        $timeout(function() {
          $scope.$apply();
        })
      });
    };

    $scope.hideTipRateApp = function() {
      $scope.tipRateApp = false;
    };

    $scope.onRefresh = function() {
      $timeout(function() {
        $scope.$broadcast('scroll.refreshComplete');
      }, 300);
      updateAllWallets();
      updateAllApplets();
    };

    $scope.isTestnet = function(networkURI) {
      return networkService.isTestnet(networkURI);
    };

    $scope.toggleLayout = function() {
      $scope.layout.current = ($scope.layout.current == 'grid' ? 'list' : 'grid');
      $scope.layout.next = ($scope.layout.current == 'grid' ? 'list' : 'grid');
    };

    $scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
      // data.slider is the instance of Swiper
      $scope.walletSlides.slider = data.slider;
    });

    $scope.$on("$ionicSlides.slideChangeStart", function(event, data) {
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {
      // The indexes are 0-based
      $scope.walletSlides.activeIndex = data.slider.activeIndex;
      $scope.walletSlides.previousIndex = data.slider.previousIndex;
    });

  });
