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

angular.module('owsWalletApp').config(function(historicLogServiceProvider, $provide, $logProvider, $stateProvider, navigationServiceProvider, $urlRouterProvider, $compileProvider, $ionicConfigProvider, configServiceProvider) {
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
    // The following injected services need to run at startup.
    //
    //   fingerprintService
    //   startupService
    //   storageService
    //

    uxLanguageService.init();

    $ionicPlatform.ready(function() {
      if (platformInfoService.isCordova) {
        if (screen.width < 768) {
          screen.lockOrientation('portrait');
        }
        Keyboard.hideFormAccessoryBar(false);
      }

      $ionicPlatform.registerBackButtonAction(function(e) {
        // From root tabs view
        var matchHome = $ionicHistory.currentStateName() == $rootScope.sref('home') ? true : false;
        var matchReceive = $ionicHistory.currentStateName() == $rootScope.sref('receive') ? true : false;
        var matchScan = $ionicHistory.currentStateName() == $rootScope.sref('scan') ? true : false;
        var matchSend = $ionicHistory.currentStateName() == $rootScope.sref('send') ? true : false;
        var matchSettings = $ionicHistory.currentStateName() == $rootScope.sref('settings') ? true : false;

        var fromTabs = matchHome | matchReceive | matchScan | matchSend | matchSettings;

        // Onboarding with no back views
        var matchStart = $ionicHistory.currentStateName() == $rootScope.sref('onboarding.start') ? true : false;
        var matchCollectEmail = $ionicHistory.currentStateName() == $rootScope.sref('onboarding.collect-email') ? true : false;
        var matchBackupRequest = $ionicHistory.currentStateName() == $rootScope.sref('onboarding.backup-request') ? true : false;
        var backedUp = $ionicHistory.backView().stateName == $rootScope.sref('onboarding.backup') ? true : false;
        var noBackView = $ionicHistory.backView().stateName == $rootScope.sref('starting') ? true : false;
        var matchDisclaimer = $ionicHistory.currentStateName() == $rootScope.sref('onboarding.disclaimer') && (backedUp || noBackView) ? true : false;

        var fromOnboarding = matchCollectEmail | matchBackupRequest | matchStart | matchDisclaimer;

        // Views with disable backbutton
        var matchComplete = $ionicHistory.currentStateName() == $rootScope.sref('rate.complete') ? true : false;
        var matchLockedView = $ionicHistory.currentStateName() == $rootScope.sref('app-lock') ? true : false;
        var matchPasscode = $ionicHistory.currentStateName() == $rootScope.sref('passcode') ? true : false;

        if ($ionicHistory.backView() && !fromTabs && !fromOnboarding && !matchComplete && !matchPasscode && !matchLockedView) {
          $ionicHistory.goBack();

        } else if ($rootScope.backButtonPressedOnceToExit) {
          navigator.app.exitApp();

        } else {
          $rootScope.backButtonPressedOnceToExit = true;
          $rootScope.$apply(function() {
            ionicToast.show(gettextCatalog.getString('Press again to exit.'), 'bottom', false, 1000);
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
        applicationService.appLockModal('start');
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
            'notify': $state.current.name == $rootScope.sref('starting') ? false : true
          }).then(function() {
            $ionicHistory.nextViewOptions({
              disableAnimate: true,
              historyRoot: true
            });
            $state.transitionTo($rootScope.sref('home')).then(function() {

              // Clear history
              $ionicHistory.clearHistory();
            });
            applicationService.appLockModal('start');
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
      $log.debug('Route change start from:', fromState.name || '-', ' to:', toState.name);
      //$log.debug('            toParams:' + JSON.stringify(toParams || {}));
      //$log.debug('            fromParams:' + JSON.stringify(fromParams || {}));
    });

  });
