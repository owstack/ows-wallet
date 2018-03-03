'use strict';
angular.module('owsWalletApp.services')
  .factory('applicationService', function($rootScope, $timeout, $ionicHistory, $ionicModal, platformInfoService, fingerprintService, configService, $state) {
    var root = {};

    root.isPasscodeModalOpen = false;

    var isNW = platformInfoService.isNW;

    root.restart = function() {
      var hashIndex = window.location.href.indexOf('#/');
      if (platformInfoService.isCordova) {
        window.location = window.location.href.substr(0, hashIndex);
        $timeout(function() {
          $rootScope.$digest();
        }, 1);

      } else {
        // Go home reloading the application
        if (isNW) {
          $ionicHistory.removeBackView();
          $state.go($rootScope.sref('home'));
          $timeout(function() {
            var win = require('nw.gui').Window.get();
            win.reload(3);
            //or
            win.reloadDev();
          }, 100);
        } else {
          window.location = window.location.href.substr(0, hashIndex);
        }
      }
    };

    root.fingerprintModal = function() {
      var scope = $rootScope.$new(true);

      $ionicModal.fromTemplateUrl('views/app-lock/fingerprint/fingerprint.html', {
        scope: scope,
        animation: 'none',
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal) {
        scope.fingerprintCheckModal = modal;
        root.isModalOpen = true;
        scope.openModal();
      });

      scope.openModal = function() {
        scope.fingerprintCheckModal.show();
        scope.checkFingerprint();
      };

      scope.hideModal = function() {
        root.isModalOpen = false;
        scope.fingerprintCheckModal.hide();
      };

      scope.checkFingerprint = function() {
        fingerprintService.check('unlockingApp', function(err) {
          if (err) return;
          $timeout(function() {
            scope.hideModal();
          }, 200);
        });
      }
    };

    root.passcodeModal = function(action, cb) {
      var scope = $rootScope.$new(true);
      scope.action = action;

      $ionicModal.fromTemplateUrl('views/app-lock/passcode/passcode.html', {
        scope: scope,
        animation: (action == 'start' ? 'none' : 'slide-in-up'),
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal) {
        scope.passcodeModal = modal;
        root.isModalOpen = true;
        scope.openModal();
      });

      scope.openModal = function() {
        scope.passcodeModal.show();
      };

      scope.hideModal = function(success) {
        if (cb) {
          cb(success);
        }
        root.isModalOpen = false;
        scope.passcodeModal.hide();
      };
    };

    root.appLockModal = function(action) {
      if (root.isModalOpen) {
        return;
      }

      configService.whenAvailable(function(config) {
        var lockMethod = config.lock && config.lock.method;
        if (!lockMethod || lockMethod == 'none') {
          return;
        }
        if (lockMethod == 'fingerprint' && fingerprintService.isAvailable()) {
          root.fingerprintModal();
        }
        if (lockMethod == 'passcode') {
          root.passcodeModal(action);
        }
      });
    }
    return root;
  });
