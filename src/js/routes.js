'use strict';

var unsupported, isaosp;

if (window && window.navigator) {
  var rxaosp = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
  isaosp = (rxaosp && rxaosp[1] < 537);
  if (!window.cordova && isaosp) {
    unsupported = true;
  }
  if (unsupported) {
    window.location = '#/unsupported';
  }
}

//Setting up route
angular.module('owsWalletApp').config(function(historicLogServiceProvider, $provide, $logProvider, $stateProvider, $urlRouterProvider, $compileProvider, $ionicConfigProvider, $ionicNativeTransitionsProvider) {
    $urlRouterProvider.otherwise('/starting');

    // NO CACHE
    //$ionicConfigProvider.views.maxCache(0);

    // TABS BOTTOM
    $ionicConfigProvider.tabs.position('bottom');

    // NAV TITTLE CENTERED
    $ionicConfigProvider.navBar.alignTitle('center');

    // NAV BUTTONS ALIGMENT
    $ionicConfigProvider.navBar.positionPrimaryButtons('left');
    $ionicConfigProvider.navBar.positionSecondaryButtons('right');

    // NAV BACK-BUTTON TEXT/ICON
    $ionicConfigProvider.backButton.icon('icon ion-ios-arrow-left').text('');
    $ionicConfigProvider.backButton.previousTitleText(false);

    // CHECKBOX CIRCLE
    $ionicConfigProvider.form.checkbox('circle');

    // USE NATIVE SCROLLING
    $ionicConfigProvider.scrolling.jsScrolling(false);

    $ionicNativeTransitionsProvider.setDefaultOptions({
      duration: 200, // in milliseconds (ms), default 400,
      slowdownfactor: 2, // overlap views (higher number is more) or no overlap (1), default 4
      iosdelay: -1, // ms to wait for the iOS webview to update before animation kicks in, default -1
      androiddelay: -1, // same as above but for Android, default -1
      fixedPixelsTop: 0, // the number of pixels of your fixed header, default 0 (iOS and Android)
      fixedPixelsBottom: 0, // the number of pixels of your fixed footer (f.i. a tab bar), default 0 (iOS and Android)
      triggerTransitionEvent: '$ionicView.afterEnter', // internal ionic-native-transitions option
      backInOppositeDirection: true // Takes over default back transition and state back transition to use the opposite direction transition to go back
    });

    $logProvider.debugEnabled(true);
    $provide.decorator('$log', ['$delegate', 'platformInfoService',
      function($delegate, platformInfoService) {
        var historicLogService = historicLogServiceProvider.$get();

        historicLogService.getLevels().forEach(function(levelDesc) {
          var level = levelDesc.level;
          if (platformInfoService.isDevel && level == 'error') return;

          var orig = $delegate[level];
          $delegate[level] = function() {
            if (level == 'error')
              console.log(arguments);

            var args = Array.prototype.slice.call(arguments);

            args = args.map(function(v) {
              try {
                if (typeof v == 'undefined') v = 'undefined';
                if (!v) v = 'null';
                if (typeof v == 'object') {
                  if (v.message)
                    v = v.message;
                  else
                    v = JSON.stringify(v);
                }
                // Trim output in mobile
                if (platformInfoService.isCordova) {
                  v = v.toString();
                  if (v.length > 3000) {
                    v = v.substr(0, 2997) + '...';
                  }
                }
              } catch (e) {
                console.log('Error at log decorator:', e);
                v = 'undefined';
              }
              return v;
            });

            try {
              if (platformInfoService.isCordova)
                console.log(args.join(' '));

              historicLogService.add(level, args.join(' '));
              orig.apply(null, args);
            } catch (e) {
              console.log('ERROR (at log decorator):', e, args[0]);
            }
          };
        });
        return $delegate;
      }
    ]);

    $stateProvider

      /*
       *
       * Other pages
       *
       */

      .state('unsupported', {
        url: '/unsupported',
        templateUrl: 'views/unsupported.html'
      })

      .state('starting', {
        url: '/starting',
        template: '<ion-view id="starting"><ion-content><div class="block-spinner row"><ion-spinner class="spinner-stable" icon="crescent"></ion-spinner></div></ion-content></ion-view>'
      })

      /*
       *
       * URI
       *
       */

      .state('uri', {
        url: '/uri/:url',
        controller: function($stateParams, $log, openUrlService, profileService) {
          profileService.whenAvailable(function() {
            $log.info('DEEP LINK from Browser:' + $stateParams.url);
            openUrlService.handleURL({
              url: $stateParams.url
            });
          })
        }
      })

      /*
       *
       * Wallet
       *
       */

      .state('tabs.wallet', {
        url: '/wallet/:walletId/:fromOnboarding',
        views: {
          // Relative view target for navigation between tab views.
          'tab-home': {
            controller: 'WalletDetailsCtrl',
            templateUrl: 'views/wallet-details.html'
          }
        }
      })
      .state('tabs.activity', {
        url: '/activity',
        views: {
          'tab-home@tabs': {
            controller: 'WalletActivityCtrl',
            templateUrl: 'views/wallet-activity.html',
          }
        }
      })
      .state('tabs.proposals', {
        url: '/proposals',
        views: {
          'tab-home@tabs': {
            controller: 'ProposalsCtrl',
            templateUrl: 'views/proposals.html',
          }
        }
      })
      .state('tabs.wallet.tx-details', {
        url: '/tx-details/:txid',
        views: {
          'tab-home@tabs': {
            controller: 'TxDetailsCtrl',
            templateUrl: 'views/tx-details.html'
          }
        }
      })
      .state('tabs.wallet.backup-warning', {
        url: '/backup-warning/:from/:walletId',
        views: {
          'tab-home@tabs': {
            controller: 'OnboardingBackupWarningCtrl',
            templateUrl: 'views/backup-warning.html'
          }
        }
      })
      .state('tabs.wallet.backup', {
        url: '/backup/:walletId',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/backup.html',
            controller: 'BackupCtrl'
          }
        }
      })

      .state('tabs.wallet.addresses', {
        url: '/addresses/:walletId/:toAddress',
        views: {
          'tab-home@tabs': {
            controller: 'AddressesCtrl',
            templateUrl: 'views/addresses.html'
          }
        }
      })
      .state('tabs.wallet.all-addresses', {
        url: '/all-addresses/:walletId',
        views: {
          'tab-home@tabs': {
            controller: 'AddressesCtrl',
            templateUrl: 'views/all-addresses.html'
          }
        }
      })

      /*
       *
       * All Wallets
       *
       */

      .state('tabs.home.all-wallets', {
        url: '/all-wallets',
        views: {
          'tab-home@tabs': {
            controller: 'AllWalletsCtrl',
            templateUrl: 'views/all-wallets.html'
          }
        }
      })

      /*
       *
       * Tabs
       *
       */

      .state('tabs', {
        nativeTransitions: null,
        url: '/tabs',
        abstract: true,
        controller: 'TabsCtrl',
        templateUrl: 'views/tabs.html'
      })
      .state('tabs.home', {
        nativeTransitions: null,
        url: '/home/:fromOnboarding',
        views: {
          'tab-home': {
            controller: 'HomeCtrl',
            templateUrl: 'views/home.html'
          }
        },
        params: {
          wallets: null,
          openWallet: null
        }
      })
      .state('tabs.receive', {
        nativeTransitions: null,
        url: '/receive/:walletId',
        views: {
          'tab-receive': {
            controller: 'ReceiveCtrl',
            templateUrl: 'views/receive.html',
          }
        }
      })
      .state('tabs.scan', {
        nativeTransitions: null,
        url: '/scan',
        views: {
          'tab-scan': {
            controller: 'ScanCtrl',
            templateUrl: 'views/scan.html',
          }
        }
      })
      .state('scanner', {
        nativeTransitions: null,
        url: '/scanner',
        params: {
          passthroughMode: null,
        },
        controller: 'ScanCtrl',
        templateUrl: 'views/scan.html'
      })
      .state('tabs.send', {
        nativeTransitions: null,
        url: '/send/:walletId',
        views: {
          'tab-send': {
            controller: 'SendCtrl',
            templateUrl: 'views/send.html',
          }
        }
      })
      .state('tabs.settings', {
        nativeTransitions: null,
        url: '/settings',
        views: {
          'tab-settings': {
            controller: 'SettingsCtrl',
            templateUrl: 'views/settings.html',
          }
        }
      })

      /*
       *
       * Send
       *
       */

      .state('tabs.send.amount', {
        url: '/amount/:walletId/:networkURI/:recipientType/:toAddress/:toName/:toEmail/:toColor',
        views: {
          'tab-send@tabs': {
            controller: 'AmountCtrl',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.send.confirm', {
        url: '/confirm/:walletId/:networkURI/:recipientType/:toAddress/:toName/:toAmount/:toEmail/:toColor/:description/:useSendMax',
        views: {
          'tab-send@tabs': {
            controller: 'ConfirmCtrl',
            templateUrl: 'views/confirm.html'
          }
        },
        params: {
          paypro: null
        }
      })
      .state('tabs.send.address-book', {
        url: '/address-book/add/:fromSendTab',
        views: {
          'tab-send@tabs': {
            templateUrl: 'views/address-book/address-book-entry-edit.html',
            controller: 'AddressBookEntryEditCtrl'
          }
        }
      })

      /*
       *
       * Add
       *
       */

      .state('tabs.add', {
        url: '/add',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/add.html'
          }
        }
      })
      .state('tabs.add.join', {
        url: '/join/:url',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/join.html',
            controller: 'JoinWalletCtrl'
          },
        }
      })
      .state('tabs.add.import', {
        url: '/import/:code',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/import.html',
            controller: 'ImportWalletCtrl'
          },
        },
      })
      .state('tabs.add.create-personal', {
        url: '/create-personal',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/create-personal.html',
            controller: 'CreateWalletCtrl'
          },
        }
      })
      .state('tabs.add.create-shared', {
        url: '/create-shared',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/create-shared.html',
            controller: 'CreateWalletCtrl'
          },
        }
      })

      /*
       *
       * Global Settings
       *
       */

      .state('tabs.notifications', {
        url: '/notifications',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesNotificationsCtrl',
            templateUrl: 'views/preferences/notifications.html'
          }
        }
      })
      .state('tabs.language', {
        url: '/language',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesLanguageCtrl',
            templateUrl: 'views/preferences/language.html'
          }
        }
      })
      .state('tabs.networks', {
        url: '/networks/:id',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesNetworksCtrl',
            templateUrl: 'views/preferences/networks.html'
          }
        }
      })
      .state('tabs.network-settings', {
        url: '/network-settings/:networkURI',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesNetworksCtrl',
            templateUrl: 'views/preferences/networks.html'
          }
        }
      })
      .state('tabs.unit', {
        url: '/unit/:networkURI',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesUnitCtrl',
            templateUrl: 'views/preferences/unit.html'
          }
        }
      })
      .state('tabs.fee', {
        url: '/fee/:networkURI',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesFeeCtrl',
            templateUrl: 'views/preferences/fee.html'
          }
        }
      })
      .state('tabs.alternative-currency', {
        url: '/alternative-currency/:networkURI',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesAltCurrencyCtrl',
            templateUrl: 'views/preferences/alternative-currency.html'
          }
        }
      })
      .state('tabs.about', {
        url: '/about',
        views: {
          'tab-settings@tabs': {
            controller: 'AboutCtrl',
            templateUrl: 'views/about.html'
          }
        }
      })
      .state('tabs.about.log', {
        url: '/logs',
        views: {
          'tab-settings@tabs': {
            controller: 'SessionLogCtrl',
            templateUrl: 'views/session-log.html'
          }
        }
      })
      .state('tabs.about.terms-of-use', {
        url: '/terms-of-use',
        views: {
          'tab-settings@tabs': {
            templateUrl: 'views/terms-of-use.html'
          }
        }
      })
      .state('tabs.advanced', {
        url: '/advanced',
        views: {
          'tab-settings@tabs': {
            controller: 'AdvancedSettingsCtrl',
            templateUrl: 'views/advanced-settings.html'
          }
        }
      })
      .state('tabs.app-lock', {
        url: '/app-lock',
        views: {
          'tab-settings@tabs': {
            controller: 'AppLockCtrl',
            templateUrl: 'views/preferences/app-lock.html',
          }
        }
      })
      .state('tabs.pin', {
        url: '/pin/:action',
        views: {
          'tab-settings@tabs': {
            controller: 'PinCtrl',
            templateUrl: 'views/pin.html',
            cache: false
          }
        }
      })

      /*
       *
       * Wallet preferences
       *
       */

      .state('tabs.preferences', {
        url: '/preferences/:walletId/:fromWallet',
        views: {
          // Relative view target for navigation between tab views.
          'tab-settings': {
            controller: 'PreferencesWalletCtrl',
            templateUrl: 'views/preferences/wallet.html'
          }
        }
      })
      .state('tabs.preferences.alias', {
        url: '/preferences/alias',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesAliasCtrl',
            templateUrl: 'views/preferences/alias.html'
          }
        }
      })
      .state('tabs.preferences.color', {
        url: '/preferences/color',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesColorCtrl',
            templateUrl: 'views/preferences/color.html'
          }
        }
      })
      .state('tabs.preferences.backup-warning', {
        url: '/backup-warning/:from',
        views: {
          'tab-settings@tabs': {
            controller: 'OnboardingBackupWarningCtrl',
            templateUrl: 'views/backup-warning.html'
          }
        }
      })
      .state('tabs.preferences.backup', {
        url: '/backup',
        views: {
          'tab-settings@tabs': {
            controller: 'BackupCtrl',
            templateUrl: 'views/backup.html'
          }
        }
      })
      .state('tabs.preferences.advanced', {
        url: '/preferences/advanced',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesAdvancedCtrl',
            templateUrl: 'views/preferences/advanced.html'
          }
        }
      })
      .state('tabs.preferences.information', {
        url: '/information',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesInformationCtrl',
            templateUrl: 'views/preferences/information.html'
          }
        }
      })
      .state('tabs.preferences.export', {
        url: '/export',
        views: {
          'tab-settings@tabs': {
            controller: 'ExportWalletCtrl',
            templateUrl: 'views/export.html'
          }
        }
      })
      .state('tabs.preferences.wallet-service-url', {
        url: '/preferences/wallet-service-url',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesWalletServiceUrlCtrl',
            templateUrl: 'views/preferences/wallet-service-url.html'
          }
        }
      })
      .state('tabs.preferences.history', {
        url: '/preferences/history',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesHistoryCtrl',
            templateUrl: 'views/preferences/history.html'
          }
        }
      })
      .state('tabs.preferences.external', {
        url: '/preferences/external-hardware',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesExternalHardwareCtrl',
            templateUrl: 'views/preferences/external-hardware.html'
          }
        }
      })
      .state('tabs.preferences.delete', {
        url: '/delete',
        views: {
          'tab-settings@tabs': {
            controller: 'PreferencesDeleteWalletCtrl',
            templateUrl: 'views/preferences/delete-wallet.html'
          }
        }
      })

      /*
       *
       * Addresses
       *
       */

      .state('tabs.settings.addresses', {
        url: '/addresses/:walletId/:toAddress',
        views: {
          'tab-settings@tabs': {
            controller: 'AddressesCtrl',
            templateUrl: 'views/addresses.html'
          }
        }
      })
      .state('tabs.settings.all-addresses', {
        url: '/all-addresses/:walletId',
        views: {
          'tab-settings@tabs': {
            controller: 'AddressesCtrl',
            templateUrl: 'views/all-addresses.html'
          }
        }
      })

      /*
       *
       * Copayers
       *
       */

      .state('tabs.copayers', {
        url: '/copayers/:walletId',
        views: {
          'tab-home': {
            templateUrl: 'views/copayers.html',
            controller: 'CopayersCtrl'
          }
        }
      })

      /*
       *
       * Addressbook
       *
       */


      .state('tabs.address-book', {
        url: '/address-book',
        views: {
          'tab-settings@tabs': {
            templateUrl: 'views/address-book/address-book.html',
            controller: 'AddressBookCtrl'
          }
        }
      })
      .state('tabs.address-book.add', {
        url: '/address-book/add/:from/:address/:networkURI',
        views: {
          'tab-settings@tabs': {
            templateUrl: 'views/address-book/address-book-entry-edit.html',
            controller: 'AddressBookEntryEditCtrl'
          }
        }
      })
      .state('tabs.address-book.entry', {
        url: '/address-book/entry/:id',
        views: {
          'tab-settings@tabs': {
            templateUrl: 'views/address-book/address-book-entry.html',
            controller: 'AddressBookEntryCtrl'
          }
        }
      })
      .state('tabs.address-book.edit', {
        url: '/address-book/edit/:id',
        views: {
          'tab-settings@tabs': {
            templateUrl: 'views/address-book/address-book-entry-edit.html',
            controller: 'AddressBookEntryEditCtrl'
          }
        }
      })

      /*
       *
       * Request Specific amount
       *
       */

      .state('tabs.payment-request', {
        url: '/payment-request',
        abstract: true,
        params: {
          id: null,
          nextStep: 'tabs.payment-request.confirm'
        }
      })

      .state('tabs.payment-request.amount', {
        url: '/amount/:networkURI',
        views: {
          'tab-receive@tabs': {
            controller: 'AmountCtrl',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.payment-request.confirm', {
        url: '/confirm/:amount/:currency',
        views: {
          'tab-receive@tabs': {
            controller: 'CustomAmountCtrl',
            templateUrl: 'views/custom-amount.html'
          }
        }
      })

      /*
       *
       * Init backup flow
       *
       */

      .state('tabs.receive.backup-warning', {
        url: '/backup-warning/:from/:walletId',
        views: {
          'tab-receive@tabs': {
            controller: 'OnboardingBackupWarningCtrl',
            templateUrl: 'views/backup-warning.html'
          }
        }
      })
      .state('tabs.receive.backup', {
        url: '/backup/:walletId',
        views: {
          'tab-receive@tabs': {
            controller: 'BackupCtrl',
            templateUrl: 'views/backup.html'
          }
        }
      })

      /*
       *
       * Paper Wallet
       *
       */

      .state('tabs.home.paper-wallet', {
        url: '/paper-wallet/:privateKey',
        views: {
          'tab-home@tabs': {
            controller: 'PaperWalletCtrl',
            templateUrl: 'views/paper-wallet.html'
          }
        }
      })

      /*
       *
       * Onboarding
       *
       */

      .state('onboarding', {
        url: '/onboarding',
        abstract: true,
        template: '<ion-nav-view name="onboarding"></ion-nav-view>'
      })
      .state('onboarding.start', {
        nativeTransitions: null,
        url: '/onboarding/start',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/start.html',
            controller: 'OnboardingStartCtrl'
          }
        }
      })
      .state('onboarding.tour', {
        url: '/onboarding/tour',
        views: {
          'onboarding': {
            templateUrl: 'views/help/tour.html',
            controller: 'HelpTourCtrl'
          }
        },
        params: {
          fromOnboarding: true
        }
      })
      .state('onboarding.create-first-wallet', {
        url: '/onboarding/create-first-wallet',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/create-first-wallet.html',
            controller: 'OnboardingCreateFirstWalletCtrl'
          }
        }
      })
      .state('onboarding.collect-email', {
        url: '/onboarding/collect-email/:walletId',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/collect-email.html',
            controller: 'OnboardingCollectEmailCtrl'
          }
        }
      })
      .state('onboarding.backup-request', {
        url: '/onboarding/backup-request/:walletId',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/backup-request.html',
            controller: 'OnboardingBackupRequestCtrl'
          }
        }
      })
      .state('onboarding.backup-warning', {
        url: '/onboarding/backup-warning/:from/:walletId',
        views: {
          'onboarding': {
            templateUrl: 'views/backup-warning.html',
            controller: 'OnboardingBackupWarningCtrl'
          }
        }
      })
      .state('onboarding.backup', {
        url: '/onboarding/backup/:walletId',
        views: {
          'onboarding': {
            templateUrl: 'views/backup.html',
            controller: 'BackupCtrl'
          }
        }
      })
      .state('onboarding.disclaimer', {
        url: '/onboarding/disclaimer/:walletId/:backedUp/:resume',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/disclaimer.html',
            controller: 'OnboardingDisclaimerCtrl'
          }
        }
      })
      .state('onboarding.import', {
        url: '/onboarding/import',
        views: {
          'onboarding': {
            templateUrl: 'views/import.html',
            controller: 'ImportWalletCtrl'
          },
        },
        params: {
          code: null,
          fromOnboarding: null
        }
      })

      /*
       *
       * Feedback
       *
       */

      .state('tabs.feedback', {
        url: '/feedback',
        views: {
          'tab-settings@tabs': {
            templateUrl: 'views/feedback/send.html',
            controller: 'FeedbackSendCtrl'
          }
        }
      })
      .state('tabs.share-app', {
        url: '/feedback/share-app/:score/:skipped/:fromSettings',
        views: {
          'tab-settings@tabs': {
            controller: 'FeedbackCompleteCtrl',
            templateUrl: 'views/feedback/complete.html'
          }
        }
      })
      .state('tabs.rate', {
        url: '/feedback/rate',
        abstract: true
      })
      .state('tabs.rate.send', {
        url: '/feedback/send/:score',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/feedback/send.html',
            controller: 'FeedbackSendCtrl'
          }
        }
      })
      .state('tabs.rate.complete', {
        url: '/feedback/complete/:score/:skipped',
        views: {
          'tab-home@tabs': {
            controller: 'FeedbackCompleteCtrl',
            templateUrl: 'views/feedback/complete.html'
          }
        }
      })
      .state('tabs.rate.rate-app', {
        url: '/feedback/rate-app/:score',
        views: {
          'tab-home@tabs': {
            controller: 'FeedbackRateAppCtrl',
            templateUrl: 'views/feedback/rateApp.html'
          }
        }
      })

      /*
       *
       * Help
       *
       */

      .state('help', {
        url: '/help',
        cache: false,
        views: {
          'tab-settings@tabs': {
            templateUrl: 'views/help/getHelp.html',
            controller: 'GetHelpCtrl'
          }
        },
        params: {
          fromOnboarding: false
        }
      })
      .state('help.tour', {
        url: '/help/tour',
        views: {
          'tab-settings@tabs': {
            templateUrl: 'views/help/tour.html',
            controller: 'HelpTourCtrl'
          }
        },
        params: {
          fromOnboarding: false
        }
      });

  })
  .run(function($rootScope, $state, $location, $log, $timeout, startupService, fingerprintService, ionicToast, $ionicHistory, $ionicPlatform, $window, appConfigService, lodash, platformInfoService, profileService, uxLanguageService, gettextCatalog, openUrlService, storageService, scannerService, emailService, applicationService) {
    // The following services injected that need to run at startup.
    //
    //   fingerprintService
    //   startupService
    //   storageService
    //

    uxLanguageService.init();

    $ionicPlatform.ready(function() {
      if (screen.width < 768 && platformInfoService.isCordova)
        screen.lockOrientation('portrait');

      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
        cordova.plugins.Keyboard.disableScroll(true);
      }

      window.addEventListener('native.keyboardshow', function() {
        document.body.classList.add('keyboard-open');
      });

      $ionicPlatform.registerBackButtonAction(function(e) {
        //from root tabs view
        var matchHome = $ionicHistory.currentStateName() == 'tabs.home' ? true : false;
        var matchReceive = $ionicHistory.currentStateName() == 'tabs.receive' ? true : false;
        var matchScan = $ionicHistory.currentStateName() == 'tabs.scan' ? true : false;
        var matchSend = $ionicHistory.currentStateName() == 'tabs.send' ? true : false;
        var matchSettings = $ionicHistory.currentStateName() == 'tabs.settings' ? true : false;

        var fromTabs = matchHome | matchReceive | matchScan | matchSend | matchSettings;

        //onboarding with no back views
        var matchStart = $ionicHistory.currentStateName() == 'onboarding.start' ? true : false;
        var matchCollectEmail = $ionicHistory.currentStateName() == 'onboarding.collect-email' ? true : false;
        var matchBackupRequest = $ionicHistory.currentStateName() == 'onboarding.backup-request' ? true : false;
        var backedUp = $ionicHistory.backView().stateName == 'onboarding.backup' ? true : false;
        var noBackView = $ionicHistory.backView().stateName == 'starting' ? true : false;
        var matchDisclaimer = $ionicHistory.currentStateName() == 'onboarding.disclaimer' && (backedUp || noBackView) ? true : false;

        var fromOnboarding = matchCollectEmail | matchBackupRequest | matchStart | matchDisclaimer;

        //views with disable backbutton
        var matchComplete = $ionicHistory.currentStateName() == 'tabs.rate.complete' ? true : false;
        var matchLockedView = $ionicHistory.currentStateName() == 'lockedView' ? true : false;
        var matchPin = $ionicHistory.currentStateName() == 'pin' ? true : false;

        if ($ionicHistory.backView() && !fromTabs && !fromOnboarding && !matchComplete && !matchPin && !matchLockedView) {
          $ionicHistory.goBack();

        } else if ($rootScope.backButtonPressedOnceToExit) {
          navigator.app.exitApp();

        } else {
          $rootScope.backButtonPressedOnceToExit = true;
          $rootScope.$apply(function() {
            ionicToast.show(gettextCatalog.getString('Press again to exit'), 'bottom', false, 1000);
          });

          $timeout(function() {
            $rootScope.backButtonPressedOnceToExit = false;
          }, 3000);
        }
        e.preventDefault();
      }, 101);

      $ionicPlatform.on('pause', function() {
        // Nothing to do
      });

      $ionicPlatform.on('resume', function() {
        applicationService.appLockModal('check');
      });

      $ionicPlatform.on('menubutton', function() {
        window.location = '#/preferences';
      });

      $log.info('Init profile...');
      // Try to open local profile
      profileService.loadAndBindProfile(function(err) {
        $ionicHistory.nextViewOptions({
          disableAnimate: true
        });
        if (err) {
          if (err.message && err.message.match('NOPROFILE')) {
            $log.debug('No profile... redirecting');
            $state.go('onboarding.start');
          } else if (err.message && err.message.match('NONAGREEDDISCLAIMER')) {
            if (lodash.isEmpty(profileService.getWallets())) {
              $log.debug('No wallets and no disclaimer... redirecting');
              $state.go('onboarding.start');
            } else {
              $log.debug('Display disclaimer... redirecting');
              $state.go('onboarding.disclaimer', {
                resume: true
              });
            }
          } else {
            throw new Error(err); // TODO-AJP: what could happen?
          }
        } else {
          profileService.storeProfileIfDirty();
          $log.debug('Profile loaded ... Starting UX.');
          scannerService.gentleInitialize();
          // Reload tab-home if necessary (from root path: starting)
          $state.go('starting', {}, {
            'reload': true,
            'notify': $state.current.name == 'starting' ? false : true
          }).then(function() {
            $ionicHistory.nextViewOptions({
              disableAnimate: true,
              historyRoot: true
            });
            $state.transitionTo('tabs.home').then(function() {
              // Clear history
              $ionicHistory.clearHistory();
            });
            applicationService.appLockModal('check');
          });
        };
        // After everything have been loaded
        $timeout(function() {
          emailService.init(); // Update email subscription if necessary
          openUrlService.init();
        }, 1000);
      });
    });

    if (platformInfoService.isNW) {
      var gui = require('nw.gui');
      var win = gui.Window.get();
      var nativeMenuBar = new gui.Menu({
        type: "menubar"
      });
      try {
        nativeMenuBar.createMacBuiltin(appConfigService.nameCase);
      } catch (e) {
        $log.debug('This is not OSX');
      }
      win.menu = nativeMenuBar;
    }

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      $log.debug('Route change from:', fromState.name || '-', ' to:', toState.name);
      //$log.debug('            toParams:' + JSON.stringify(toParams || {}));
      //$log.debug('            fromParams:' + JSON.stringify(fromParams || {}));
    });
  });
