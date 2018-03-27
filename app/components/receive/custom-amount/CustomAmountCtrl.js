'use strict';

angular.module('owsWalletApp.controllers').controller('CustomAmountCtrl', function($scope, txFormatService, platformInfoService, configService, profileService, walletService, popupService, networkService) {

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
    $scope.protocol = networkService.getNetworkByURI($scope.wallet.networkURI).protocol;

    var standardUnit = networkService.getStandardUnit($scope.wallet.networkURI);
    var parsedAmount = txFormatService.parseAmount($scope.wallet.networkURI, amount, currency);
    amount = parsedAmount.amount;
    currency = parsedAmount.currency;

    $scope.amountUnitStr = parsedAmount.amountUnitStr;

    if (currency != standardUnit.shortName) {
      // Convert to standard units
      var config = configService.getSync().currencyNetworks[$scope.wallet.networkURI];

      var amountAtomic = txFormatService.atomicToUnit($scope.wallet.networkURI, parsedAmount.amountAtomic);
      var standardParsedAmount = txFormatService.parseAmount($scope.wallet.networkURI, amountAtomic, config.unitName);
      
      $scope.amountStandard = standardParsedAmount.amount;
      $scope.altAmountStr = standardParsedAmount.amountUnitStr;
    } else {
      $scope.amountStandard = amount;
      $scope.altAmountStr = txFormatService.formatAlternativeStr($scope.wallet.networkURI, parsedAmount.amountAtomic);
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

  $scope.isTestnet = function(networkURI) {
    return networkService.isTestnet(networkURI);
  };

  function showErrorAndBack(title, msg) {
    popupService.showAlert(title, msg, function() {
      $scope.close();
    });
  };

});
