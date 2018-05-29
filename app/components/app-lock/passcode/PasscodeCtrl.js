'use strict';

angular.module('owsWalletApp.controllers').controller('PasscodeCtrl', function($interval, $timeout, $scope, $log, configService, appConfig) {

  var ATTEMPT_LIMIT = 3;
  var ATTEMPT_LOCK_OUT_TIME = 5 * 60;
  var passcodeLength = 4;

  var currentPasscode;
  currentPasscode = $scope.confirmPasscode = '';

  $scope.match = $scope.error = false;
  $scope.attemptsRemaining = ATTEMPT_LIMIT;
  $scope.multipleAttempts = false;
  $scope.appName = appConfig.nameCase;

  configService.whenAvailable(function(config) {
    if (!config.lock) {
      return;
    }
    $scope.bannedUntil = config.lock.bannedUntil || null;
    if ($scope.bannedUntil) {
      var now = Math.floor(Date.now() / 1000);
      if (now < $scope.bannedUntil) {
        $scope.error = true;
        lockTimeControl($scope.bannedUntil);
      }
    }
  });

  function getSavedMethod() {
    var config = configService.getSync();
    if (config.lock) {
      return config.lock.method;
    }
    return 'none';
  };

  function checkAttempts() {
    $scope.attemptsRemaining -= 1;
    $scope.multipleAttempts = ($scope.attemptsRemaining < ATTEMPT_LIMIT);
    $log.debug('Attempts to unlock:', ATTEMPT_LIMIT - $scope.attemptsRemaining);

    if ($scope.attemptsRemaining === 0) {
      var bannedUntil = Math.floor(Date.now() / 1000) + ATTEMPT_LOCK_OUT_TIME;
      saveFailedAttempt(bannedUntil);
    }
  };

  function lockTimeControl(bannedUntil) {
    var countDown;
    setExpirationTime();

    // Start on next digest, allows UI to update immediatley.
    $timeout(function() {
      countDown = $interval(function() {
        setExpirationTime();
      }, 1000);
    });

    function setExpirationTime() {
      var now = Math.floor(Date.now() / 1000);
      if (now > bannedUntil) {
        if (countDown) {
          reset();
        }
      } else {
        var totalSecs = bannedUntil - now;
        var m = Math.floor(totalSecs / 60);
        var s = totalSecs % 60;
        $scope.expires = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
      }
    };

    function reset() {
      $scope.expires = $scope.error = $scope.multipleAttempts = false;
      $scope.attemptsRemaining = ATTEMPT_LIMIT;
      currentPasscode = $scope.confirmPasscode = '';
      $interval.cancel(countDown);
      $timeout(function() {
        $scope.$apply();
      });
      return;
    };
  };

  $scope.getFilledClass = function(limit) {
    return currentPasscode.length >= limit ? 'filled-passcode' : null;
  };

  $scope.delete = function() {
    if (currentPasscode.length > 0) {
      currentPasscode = currentPasscode.substring(0, currentPasscode.length - 1);
      $scope.error = false;
      $scope.updatePasscode();
    }
  };

  $scope.isComplete = function() {
    if (currentPasscode.length < passcodeLength) {
      return false;
    } else {
      return true;
    }
  };

  $scope.updatePasscode = function(value) {
    $scope.error = false;
    if (value && !$scope.isComplete()) {
      currentPasscode = currentPasscode + value;
    }

    if ($scope.isComplete()) {
      $scope.save();
    }
  };

  function isMatch(passcode) {
    var config = configService.getSync();
    return config.lock.value == passcode;
  };

  $scope.save = function() {
    var savedMethod = getSavedMethod();

    switch ($scope.action) {
      case 'setup':
        applyAndCheckPasscode();
        break;
      case 'disable':
        if (isMatch(currentPasscode)) {
          deletePasscode();
        } else {
          showError();
          checkAttempts();
        }
        break;
      case 'check':
      case 'start':
        if (isMatch(currentPasscode)) {
          $scope.hideModal(true);
          return;
        }
        showError();
        checkAttempts();
        break;
    }
  };

  function showError() {
    $timeout(function() {
      $scope.confirmPasscode = currentPasscode = '';
      $scope.error = true;
    }, 100);  // Allow ui to update filling dots
  };

  function applyAndCheckPasscode() {
    if (!$scope.confirmPasscode) {
      $timeout(function() {
        $scope.confirmPasscode = currentPasscode;
        currentPasscode = '';
      }, 100); // Allow ui to update filling dots

    } else {
      if ($scope.confirmPasscode == currentPasscode) {
        savePasscode($scope.confirmPasscode);
      } else {
        $timeout(function() {
          $scope.confirmPasscode = currentPasscode = '';
        }, 100); // Allow ui to update filling dots
      }
    }
  };

  function deletePasscode() {
    var opts = {
      lock: {
        method: 'none',
        value: null,
        bannedUntil: null,
      }
    };

    configService.set(opts, function(err) {
      if (err) {
        $log.error(err);
      }
      $timeout(function() {
        $scope.hideModal(err ? false : true);
      }, 100); // Allow ui to update filling dots
    });
  };

  function savePasscode(value) {
    var opts = {
      lock: {
        method: 'passcode',
        value: value,
        bannedUntil: null,
      }
    };

    configService.set(opts, function(err) {
      if (err) {
        $log.error(err);
      }
      $timeout(function() {
        $scope.hideModal(err ? false : true);
      }, 100); // Allow ui to update filling dots
    });
  };

  function saveFailedAttempt(bannedUntil) {
    var opts = {
      lock: {
        bannedUntil: bannedUntil,
      }
    };

    configService.set(opts, function(err) {
      if (err) {
        $log.error(err);
      }
      lockTimeControl(bannedUntil);
    });
  };

});
