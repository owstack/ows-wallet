'use strict';

angular.module('owsWalletApp.controllers').controller('ChooseFeeLevelCtrl', function($scope, $timeout, $log, lodash, gettextCatalog, feeService, ongoingProcessService, popupService, networkService) {

  var FEE_MIN = 0;

  var showErrorAndClose = function(title, msg) {
    title = title || gettextCatalog.getString('Error');
    $log.error(msg);
    popupService.showAlert(title, msg, function() {
      $scope.chooseFeeLevelModal.hide();
    });
  };

  var getMinRecommended = function() {
    var value = lodash.find($scope.feeLevels, {
      level: 'superEconomy'
    });
    return parseInt((value.feePerKb / 1000).toFixed());
  };

  var getMaxRecommended = function() {
    var value = lodash.find($scope.feeLevels, {
      level: 'urgent'
    });
    return parseInt((value.feePerKb / 1000).toFixed());
  };

  $scope.ok = function() {
    $scope.customFeePerKB = $scope.customFeePerKB ? ($scope.customAtomicPerByte.value * 1000).toFixed() : null;
    $scope.hideModal($scope.feeLevel, $scope.customFeePerKB);
  };

  $scope.setFeesRecommended = function() {
    $scope.maxFeeRecommended = getMaxRecommended();
    $scope.minFeeRecommended = getMinRecommended();
  };

  $scope.checkFees = function(feePerAtomicByte) {
    var fee = Number(feePerAtomicByte);

    if (fee <= FEE_MIN) {
      $scope.showNoFeeError = true;
    } else {
      $scope.showNoFeeError = false;
    }

    if (fee < $scope.minFeeRecommended) {
      $scope.showMinWarning = true;
    } else {
      $scope.showMinWarning = false;
    }

    if (fee > $scope.maxFeeRecommended) {
      $scope.showMaxWarning = true;
    } else {
      $scope.showMaxWarning = false;
    }
  };

  $scope.updateFeeRate = function() {
    var fl = lodash.find($scope.feeLevels, {
      level: $scope.feeLevel
    });

    if (fl.feePerKb) {
      // Pre-defined fee level
      $scope.customFeePerKB = null;
      $scope.feePerAtomicByte = (fl.feePerKb / 1000).toFixed();
      $scope.avgConfirmationTime = fl.nbBlocks * 10;
    } else {
      // Custom fee
      $scope.avgConfirmationTime = null;
      $scope.customAtomicPerByte = { value: Number($scope.feePerAtomicByte) };
      $scope.customFeePerKB = ($scope.feePerAtomicByte * 1000).toFixed();
    }

    // Warnings
    $scope.setFeesRecommended();
    $scope.checkFees($scope.feePerAtomicByte);

    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.$watch('selectedFee.value',
    function(newValue, oldValue) {
      if (newValue != oldValue) {
        $log.debug('New fee level: ' + newValue);
        $scope.feeLevel = $scope.selectedFee.value;
        $scope.updateFeeRate();
      }
    }
  );

  // From parent controller
  // $scope.networkName
  // $scope.feeLevel
  //
  // IF usingCustomFee
  // $scope.customFeePerKB
  // $scope.feePerAtomicByte

  var network = networkService.getNetworkByName($scope.networkName);
  $scope.networkLabel = network.shortLabel;
  $scope.atomicUnit = network.Unit().atomicsName();

  if (lodash.isEmpty($scope.feeLevel)) {
    showErrorAndClose(null, gettextCatalog.getString('Fee level is not defined.') );
  }
  $scope.selectedFee = { value: $scope.feeLevel };

  $scope.feeChoices = feeService.getFeeChoices($scope.networkName);
  $scope.loadingFee = true;

  feeService.getFeeLevels($scope.networkName, function(err, levels) {
    $scope.loadingFee = false;
    if (err || lodash.isEmpty(levels)) {
      showErrorAndClose(null, err);
      return;
    }

    if (lodash.isEmpty(levels)) {
      showErrorAndClose(null, gettextCatalog.getString('Could not get fee levels.'));
      return;
    }

    $scope.feeLevels = levels;

    lodash.forEach(Object.keys($scope.feeChoices), function(feeOpt) {
      var feeLevel = lodash.find($scope.feeLevels, function(fl) {
        return fl.level == feeOpt;
      });

      if (feeLevel) {
        feeLevel.name = $scope.feeChoices[feeLevel.level];
        feeLevel.atomicUnitName = network.Unit().atomicName();
        feeLevel.feePerAtomicUnitByte = (feeLevel.feePerKb / 1000).toFixed();
        feeLevel.avgConfirmationTime = feeLevel.nbBlocks * 10;
      } else {
        $scope.feeLevels.push({
          level: feeOpt,
          name: $scope.feeChoices[feeOpt]
        });
      }
    });

    $scope.updateFeeRate();
  });

});
