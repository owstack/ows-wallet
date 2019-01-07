'use strict';

angular.module('owsWalletApp.controllers').controller('NetworkFeePolicySettingsCtrl', function($scope, $timeout, $ionicHistory, $log, lodash, gettextCatalog, configService, feeService, ongoingProcessService, popupService, networkService, helpService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.networkName = data.stateParams.networkName;
    if (!$scope.networkName) {
      return;
    }

    $scope.network = networkService.getNetworkByName($scope.networkName);
    $scope.feeChoices = feeService.getFeeChoices($scope.networkName);
    $scope.currentFeeLevel = $scope.feeLevel || feeService.getCurrentFeeLevel($scope.networkName);
    $scope.loadingFee = true;
    
    feeService.getFeeLevels($scope.networkName, function(err, levels) {
      $scope.loadingFee = false;
      delete $scope.feeWarning;

      if (err && !levels) {
        //Error is already formatted
        return popupService.showAlert(err);
      } else if (err && levels) {
        //Error is already formatted
        $scope.feeWarning = err;
      }

      $scope.feeLevels = levels;

      lodash.forEach($scope.feeLevels, function(feeLevel) {
        feeLevel.name = $scope.feeChoices[feeLevel.level];
        feeLevel.atomicUnitName = networkService.getNetworkByName($scope.networkName).Unit().atomicsName();
        feeLevel.feePerAtomicUnitByte = (feeLevel.feePerKb / 1000).toFixed();
        feeLevel.avgConfirmationTime = feeLevel.nbBlocks * 10;
      });

      $timeout(function() {
        $scope.$apply();
      });
    });
  });

  $scope.save = function(newFee) {
    $scope.currentFeeLevel = newFee;

    var opts = {
      networkPreferences: {}
    };

    opts.networkPreferences[$scope.networkName] = {
      feeLevel: newFee
    };

    configService.set(opts, function(err) {
      if (err) {
        $log.error(err);
      }
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  $scope.getMinimumRecommeded = function() {
    var value = lodash.find($scope.feeLevels, {
      level: 'superEconomy'
    });
    return parseInt((value.feePerKb / 1000).toFixed());
  };

  var setMinWarning = function() {
    if (parseInt($scope.feeLevels[$scope.currentFeeLevel].feePerAtomicUnitByte) < $scope.getMinimumRecommeded()) {
      $scope.showMinWarning = true;
    } else {
      $scope.showMinWarning = false;
    }
  };

  var setMaxWarning = function() {
    if (parseInt($scope.feeLevels[$scope.currentFeeLevel].feePerAtomicUnitByte) > 1000) {
      $scope.showMaxWarning = true;
    } else {
      $scope.showMaxWarning = false;
    }
  };

  $scope.learnMore = function() {
    // TODO-AJP:
    var locationPrefix = 'tbd';
    var topicId = 'tbd';
    helpService.learnMore($scope, locationPrefix, topicId);
  };

});
