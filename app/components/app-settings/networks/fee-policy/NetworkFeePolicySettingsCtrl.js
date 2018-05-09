'use strict';

angular.module('owsWalletApp.controllers').controller('NetworkFeePolicySettingsCtrl', function($scope, $timeout, $ionicHistory, $log, lodash, gettextCatalog, configService, feeService, ongoingProcessService, popupService, networkService, helpService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.networkURI = data.stateParams.networkURI;
    if (!$scope.networkURI) {
      return;
    }

    $scope.network = networkService.getNetworkByURI($scope.networkURI);
    $scope.feeOpts = feeService.getFeeOpts($scope.networkURI);
    $scope.currentFeeLevel = $scope.feeLevel || feeService.getCurrentFeeLevel($scope.networkURI);
    $scope.loadingFee = true;
    
    feeService.getFeeLevels($scope.networkURI, function(err, levels) {
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
        feeLevel.name = $scope.feeOpts[feeLevel.level];
        feeLevel.atomicUnitCode = networkService.getAtomicUnit($scope.networkURI).shortName;
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
      currencyNetworks: {}
    };

    opts.currencyNetworks[$scope.networkURI] = {
      feeLevel: newFee
    };

    configService.set(opts, function(err) {
      if (err) {
        $log.debug(err);
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
