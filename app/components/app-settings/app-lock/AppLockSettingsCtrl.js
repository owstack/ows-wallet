'use strict';

angular.module('owsWalletApp.controllers').controller('AppLockSettingsCtrl', function($scope, $timeout, $log, configService, gettextCatalog, fingerprintService, profileService, lodash, applicationService, networkService) {

  $scope.$on("$ionicView.beforeEnter", function(event) {
    $scope.options = [
      {
        method: 'none',
        label: gettextCatalog.getString('Disabled')
      },
      {
        method: 'passcode',
        label: gettextCatalog.getString('Lock by Passcode'),
        disabled: true,
        backupRequiredForUse: true
      },
      {
        method: 'pattern',
        label: gettextCatalog.getString('Lock by Pattern'),
        disabled: true,
        backupRequiredForUse: true
      },
    ];

    if (fingerprintService.isAvailable()) {
      $scope.options.push({
        method: 'fingerprint',
        label: gettextCatalog.getString('Lock by Fingerprint'),
        disabled: true,
        backupRequiredForUse: true
      });
    }

    initMethodSelector();
    processWallets();
  });

  function getSavedMethod() {
    var config = configService.getSync();
    if (config.lock && config.lock.method) {
      return lodash.clone(config.lock.method);
    }
    return 'none';
  };

  function initMethodSelector() {
    var savedMethod = getSavedMethod();
    $scope.currentOption = {
      value: savedMethod
    };

    $timeout(function() {
      $scope.$apply();
    });
  };

  function processWallets() {
    var wallets = profileService.getWallets();
    var singleWallet = wallets.length == 1 && wallets[0].needsBackup;
    var atLeastOneWallet = lodash.some(wallets, function(w) {
      return w.needsBackup;
    });

    if (singleWallet) {
      $scope.error = {
        title: gettextCatalog.getString('Backup Required'),
        message: gettextCatalog.getString('You must backup your wallet in order to use the app lock.')
      };
      disableOptsUntilBackup();
    } else if (atLeastOneWallet) {
      $scope.error = {
        title: gettextCatalog.getString('Backup Required'),
        message: gettextCatalog.getString('You must backup all of your wallets in order to use the app lock.')
      };
      disableOptsUntilBackup();
    } else {
      enableOptsAfterBackup();
      $scope.error = null;
    }

    function enableOptsAfterBackup() {
      lodash.forEach($scope.options, function(opt) {
        if (opt.backupRequiredForUse) {
          opt.disabled = false;
        }
      });
    };

    function disableOptsUntilBackup() {
      lodash.forEach($scope.options, function(opt) {
        if (opt.backupRequiredForUse) {
          opt.disabled = true;
        }
      });
    };
  };

  function optionIsDisabled(optionId) {
    return lodash.find($scope.options, function(opt) {
      return opt.method == optionId;
    }).disabled;
  };

  $scope.select = function(selectedMethod) {
    if (optionIsDisabled(selectedMethod)) {
      return;
    }

    var savedMethod = getSavedMethod();
    if (savedMethod == selectedMethod) {
      return;
    }

    if (selectedMethod == 'none') {
      disableMethod(savedMethod);
    } else {
      disableMethod(savedMethod, function(success) {
        if (success) {
          enableMethod(selectedMethod);
        }
      });
    }
  };

  function disableMethod(method, cb) {
    switch (method) {
      case 'passcode':
        applicationService.passcodeModal('disable', function(success) {
          initMethodSelector();
          if (cb) {
            cb(success);
          }
        });
        break;
      case 'fingerprint':
        fingerprintService.check('unlock', function(err) {
          if (!err) {
            saveConfig('none', function() {
              initMethodSelector();
            });
          } else {
            initMethodSelector();            
          }
          if (cb) {
            cb(err ? false : true);
          }
        });
        break;
      case 'pattern':
        applicationService.patternModal('disable', function(success) {
          initMethodSelector();
          if (cb) {
            cb(success);
          }
        });
        break;
      default:
        if (cb) {
          cb(true);
        }
        break;
    }
  };

  function enableMethod(method) {
    switch (method) {
      case 'passcode':
        applicationService.passcodeModal('setup', function(success) {
          initMethodSelector();
        });
        break;
      case 'fingerprint':
        saveConfig('fingerprint', function(err) {
          initMethodSelector();
        });
        break;
      case 'pattern':
        applicationService.patternModal('setup', function(success) {
          initMethodSelector();
        });
        break;
    }
  };

  function saveConfig(method, cb) {
    var opts = {
      lock: {
        method: method,
        value: null
      }
    };

    configService.set(opts, function(err) {
      if (err) {
        $log.error(err);
      }
      if (cb) {
        cb(err);
      }
    });
  };

});
