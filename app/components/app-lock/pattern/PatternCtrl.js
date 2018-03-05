'use strict';

angular.module('owsWalletApp.controllers').controller('PatternCtrl', function($scope, $state, $interval, $timeout, $log, configService, appConfigService) {
 
  var ATTEMPT_LIMIT = 3;
  var ATTEMPT_LOCK_OUT_TIME = 5 * 60;
  var FIRST_DRAW_LINGER_TIME = 1000; // ms
  var CONFIRMED_SET_LINGER_TIME = 3000;
  var INCORRECT_LINGER_TIME = 1000;
  var UNLOCKED_LINGER_TIME = 1000;

  var patternLock;
  var currentPattern;
  currentPattern = $scope.confirmPattern = '';

  $scope.success = $scope.error = false;
  $scope.attemptsRemaining = ATTEMPT_LIMIT;
  $scope.multipleAttempts = false;
  $scope.setupState = 'draw';
  $scope.appName = appConfigService.nameCase;

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

  $scope.setLock = function(lock) {
    patternLock = lock;
  };

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
    } else {
      $timeout(function() {
        patternLock.reset();
      }, INCORRECT_LINGER_TIME);
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
      patternLock.reset();
      $scope.expires = $scope.error = $scope.multipleAttempts = false;
      $scope.attemptsRemaining = ATTEMPT_LIMIT;
      currentPattern = $scope.confirmPattern = '';
      $interval.cancel(countDown);

      $timeout(function() {
        $scope.$apply();
      });
      return;
    };
  };

  $scope.updatePattern = function(pattern) {
    $scope.error = false;
    currentPattern = pattern;
    $scope.save();
  };

  function isMatch(pattern) {
    var config = configService.getSync();
    return config.lock.value == pattern;
  };

  $scope.save = function() {
    var savedMethod = getSavedMethod();

    switch ($scope.action) {
      case 'setup':
        applyAndCheckPattern();
        break;
      case 'disable':
        if (isMatch(currentPattern)) {
          $scope.success = true;
          $timeout(function() {
            $scope.$apply();
          });

          // Show unlock pattern for some time before before deleting it and closing modal.
          $timeout(function() {
            deletePattern(function(err) {
              $scope.hideModal(err ? false : true);
            });
          }, UNLOCKED_LINGER_TIME);
        } else {
          showError();
          checkAttempts();
        }
        break;
      case 'check':
      case 'start':
        if (isMatch(currentPattern)) {
          $scope.success = true;
          $timeout(function() {
            $scope.$apply();
          });

          // Show unlock pattern for some time before hiding the modal.
          $timeout(function() {
            $scope.hideModal(true);
          }, UNLOCKED_LINGER_TIME);
          return;
        }
        showError();
        checkAttempts();
        break;
    }
  };

  function showError() {
    $scope.confirmPattern = currentPattern = '';
    $scope.error = true;
    patternLock.error();

    $timeout(function() {
      $scope.$apply();
    });
  };

  function applyAndCheckPattern() {
    if (!$scope.confirmPattern) {
      $scope.confirmPattern = currentPattern;
      currentPattern = '';
      $scope.setupState = 'draw';
      patternLock.disable();

      $timeout(function() {
        patternLock.enable();
        patternLock.reset();
        $scope.setupState = 'confirm';

        $timeout(function() {
          $scope.$apply();
        });
      }, FIRST_DRAW_LINGER_TIME);
    } else {
      if ($scope.confirmPattern == currentPattern) {
        $scope.setupState = 'done';
        patternLock.disable();
        savePattern($scope.confirmPattern);

        $scope.success = true;
        $timeout(function() {
          $scope.$apply();
        });

        // Show the confirmed pattern for a time before closing the modal.
        $timeout(function() {
          $scope.hideModal(true);
        }, CONFIRMED_SET_LINGER_TIME);
      } else {
        $scope.setupState = 'try-again';
        patternLock.disable();
        showError();

        // Show incorrect pattern for some time before resetting for next attempt.
        $timeout(function() {
          patternLock.enable();
          patternLock.reset();
          $scope.setupState = 'Draw';

          $timeout(function() {
            $scope.$apply();
          });
        }, INCORRECT_LINGER_TIME);
      }
    }
    $timeout(function() {
      $scope.$apply();
    });
  };

  function deletePattern(cb) {
    var opts = {
      lock: {
        method: 'none',
        value: null,
        bannedUntil: null
      }
    };

    configService.set(opts, function(err) {
      if (err) {
        $log.debug(err);
      }
      cb(err);
    });
  };

  function savePattern(value) {
    var opts = {
      lock: {
        method: 'pattern',
        value: value,
        bannedUntil: null
      }
    };

    configService.set(opts, function(err) {
      if (err) {
        $log.debug(err);
      }
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
        $log.debug(err);
      }
      lockTimeControl(bannedUntil);
    });
  };

});
