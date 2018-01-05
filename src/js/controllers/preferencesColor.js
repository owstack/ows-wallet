'use strict';

angular.module('owsWalletApp.controllers').controller('preferencesColorController', function($scope, $timeout, $log, $stateParams, $ionicHistory, configService, profileService, uiService) {
  var wallet = profileService.getWallet($stateParams.walletId);
  $scope.wallet = wallet;
  var walletId = wallet.credentials.walletId;
  var config = configService.getSync();
  config.colorFor = config.colorFor || {};

  var retries = 3;
  $scope.colorCount = getColorCount();
  setCurrentColorIndex();

  $scope.save = function(i) {
    var color = indexToColor(i);
    if (!color) return;

    var opts = {
      colorFor: {}
    };
    opts.colorFor[walletId] = color;

    configService.set(opts, function(err) {
      if (err) $log.warn(err);
      $ionicHistory.goBack();
    });
  };

  function getColorCount() {
    var count = window.getComputedStyle(document.getElementsByClassName('wallet-color-count')[0]).content;
    return parseInt(count.replace(/[^0-9]/g, ''));
  };

  function setCurrentColorIndex() {
    try {
      $scope.currentColorIndex = colorToIndex(config.colorFor[walletId] || uiService.getDefaultWalletColor());
    } catch(e) {
      // Wait for DOM to render and try again.
      $timeout(function() {
        if (retries > 0) {
          retries -= 1;
          setCurrentColorIndex();
        }
      }, 100);
    }
  };

  function colorToIndex(color) {
    for (var i = 0; i < $scope.colorCount; i++) {
      if (indexToColor(i) == color.toLowerCase()) {
        return i;
      }
    }
    return undefined;
  };

  function indexToColor(i) {
    // Expect an exception to be thrown if can't getComputedStyle().
    return uiService.rgb2hex(window.getComputedStyle(document.getElementsByClassName('wallet-color-' + i)[0]).backgroundColor);
  };

});
