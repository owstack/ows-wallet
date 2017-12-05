'use strict';

angular.module('owsWalletApp.controllers').controller('customAmountController', function($scope, $ionicHistory, txFormatService, platformInfo, configService, profileService, walletService, popupService, networkService) {

  var showErrorAndBack = function(title, msg) {
    popupService.showAlert(title, msg, function() {
      $scope.close();
    });
  };

  var setProtocol = function() {
    $scope.protocol = networkService.getNetworkByURI($scope.wallet.networkURI).protocol;
  }

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    var walletId = data.stateParams.id;

    if (!walletId) {
      showErrorAndBack('Error', 'No wallet selected');
      return;
    }
      
    $scope.showShareButton = platformInfo.isCordova ? (platformInfo.isIOS ? 'iOS' : 'Android') : null;

    $scope.wallet = profileService.getWallet(walletId);

    setProtocol();

    walletService.getAddress($scope.wallet, false, function(err, addr) {
      if (!addr) {
        showErrorAndBack('Error', 'Could not get the address');
        return;
      }
      
      $scope.address = addr;
    
      var parsedAmount = txFormatService.parseAmount(
        $scope.wallet.networkURI,
        data.stateParams.amount, 
        data.stateParams.currency);

      var amount = parsedAmount.amount;
      var currency = parsedAmount.currency;
      $scope.amountAtomicStr = parsedAmount.amountAtomicStr;

      var standardUnit = networkService.getStandardUnit($scope.wallet.networkURI);

      if (currency != standardUnit.shortName) {
        // Convert to standard units
        var config = configService.getSync().currencyNetworks[$scope.wallet.networkURI];

        var amountAtomic = txFormatService.atomicToUnit($scope.wallet.networkURI, parsedAmount.amountAtomic);
        var standardParsedAmount = txFormatService.parseAmount($scope.wallet.networkURI, amountAtomic, config.unitName);
        
        $scope.amountStandard = standardParsedAmount.amount;
        $scope.altAmountStr = standardParsedAmount.amountAtomicStr;
      } else {
        $scope.amountStandard = amount;
        $scope.altAmountStr = txFormatService.formatAlternativeStr($scope.wallet.networkURI, parsedAmount.amountAtomic);
      }
    });
  });

  $scope.close = function() {
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });
    $ionicHistory.goBack(-2);
  };

  $scope.shareAddress = function() {
    if (!platformInfo.isCordova) return;
    var data = $scope.protocol + $scope.address + '?amount=' + $scope.amountStandard;
    window.plugins.socialsharing.share(data, null, null, null);
  }

  $scope.copyToClipboard = function() {
    return $scope.protocol + $scope.address + '?amount=' + $scope.amountStandard;
  };

});
