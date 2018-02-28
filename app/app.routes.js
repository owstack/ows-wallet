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
angular.module('owsWalletApp').config(function(historicLogServiceProvider, $provide, $logProvider, $stateProvider, navigationServiceProvider, $urlRouterProvider, $compileProvider, $ionicConfigProvider, $ionicNativeTransitionsProvider, configServiceProvider) {
    $urlRouterProvider.otherwise('/starting');

    // NO CACHE
    //$ionicConfigProvider.views.maxCache(0);

    // TABS BOTTOM
    $ionicConfigProvider.tabs.position('bottom');

    // NAV TITLE CENTERED
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
      duration: 300, // in milliseconds (ms), default 400,
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

    // Configure routing for the selected app navigation scheme.
    var configService = configServiceProvider.$get();
    configService.get(function(err, config) {
      if (err) {
        $log.warn('Failed to read app config while setting up app navigation scheme: ' + err);
        return;
      }

      var navigationService = navigationServiceProvider.$get();
      navigationService.init(config.appNavigation, $stateProvider);
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
      if (screen.width < 768 && platformInfoService.isCordova) {
        screen.lockOrientation('portrait');
      }

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
            $state.go($rootScope.sref('onboarding.start'));
          } else if (err.message && err.message.match('NONAGREEDDISCLAIMER')) {
            if (lodash.isEmpty(profileService.getWallets())) {
              $log.debug('No wallets and no disclaimer... redirecting');
              $state.go($rootScope.sref('onboarding.start'));
            } else {
              $log.debug('Display disclaimer... redirecting');
              $state.go($rootScope.sref('onboarding.disclaimer'), {
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
          $state.go($rootScope.sref('starting'), {}, {
            'reload': true,
            'notify': $state.current.name == 'starting' ? false : true
          }).then(function() {
            $ionicHistory.nextViewOptions({
              disableAnimate: true,
              historyRoot: true
            });
            $state.transitionTo($rootScope.sref('home')).then(function() {

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
