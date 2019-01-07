'use strict';

angular.module('owsWalletApp.controllers').controller('CustomAmountCtrl', function($scope, lodash, txFormatService, platformInfoService, configService, profileService, walletService, popupService, networkService) {

  // topScope is AmountCtrl
  var amount = $scope.topScope.amount;
  var currency = $scope.topScope.currency;
  var walletId = $scope.topScope.walletId;

  init();

  function init() {
    if (!walletId) {
      showErrorAndBack('Error', 'No wallet selected');
      return;
    }
      
    $scope.showShareButton = platformInfoService.isCordova ? (platformInfoService.isIOS ? 'iOS' : 'Android') : null;
    $scope.wallet = profileService.getWallet(walletId);
    $scope.protocol = networkService.getNetworkByName($scope.wallet.networkName).protocol;

    var config = configService.getSync();
    var network = networkService.getNetworkByName($scope.wallet.networkName);
    var standardUnit = network.Unit().standardsName();
    var parsedAmount = txFormatService.parseAmount($scope.wallet.networkName, amount, currency);
    amount = parsedAmount.amount;
    currency = parsedAmount.currency;

    $scope.amountUnitStr = parsedAmount.amountUnitStr;

    if (currency != standardUnit.shortName) {
      // Convert to standard units
      var unitName = lodash.find(network.Unit().units, function(u) {
        return u.code == networkPreferences[$scope.wallet.networkName].unitCode;
      }).shortName;

      var amountAtomic = txFormatService.atomicToUnit($scope.wallet.networkName, parsedAmount.amountAtomic);
      var standardParsedAmount = txFormatService.parseAmount($scope.wallet.networkName, amountAtomic, unitName);
      
      $scope.amountStandard = standardParsedAmount.amount;
      $scope.altAmountStr = standardParsedAmount.amountUnitStr;
    } else {
      $scope.amountStandard = amount;
      $scope.altAmountStr = txFormatService.formatAlternativeStr($scope.wallet.networkName, parsedAmount.amountAtomic);
    }

    walletService.getAddress($scope.wallet, false, function(err, addr) {
      if (!addr) {
        showErrorAndBack('Error', 'Could not get the address');
        return;
      }
      $scope.address = addr;
    });
  };

  $scope.closeModal = function() {
    $scope.topScope.closeModal();
  };

  $scope.shareAddress = function() {
    if (!platformInfoService.isCordova) return;
    var data = $scope.protocol + ':' + $scope.address + '?amount=' + $scope.amountStandard;
    window.plugins.socialsharing.share(data, null, null, null);
  }

  $scope.copyToClipboard = function() {
    return $scope.protocol + ':' + $scope.address + '?amount=' + $scope.amountStandard;
  };

  function showErrorAndBack(title, msg) {
    popupService.showAlert(title, msg, function() {
      $scope.close();
    });
  };

});
