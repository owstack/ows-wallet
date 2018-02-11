'use strict';

angular.module('owsWalletApp.services').factory('txpModalService', function(configService, profileService, $rootScope, $timeout, $ionicModal, $ionicScrollDelegate) {

  var root = {};

  root.open = function(tx) {
    var wallet = tx.wallet ? tx.wallet : profileService.getWallet(tx.walletId);
    var config = configService.getSync().wallet;
    var scope = $rootScope.$new(true);
    scope.tx = tx;
    if (!scope.tx.toAddress) {
      scope.tx.toAddress = tx.outputs[0].toAddress;
    }
    scope.wallet = wallet;
    scope.copayers = wallet ? wallet.copayers : null;
    scope.currentSpendUnconfirmed = config.spendUnconfirmed;
    // scope.tx.hasMultiplesOutputs = true;  // Uncomment to test multiple outputs

    $ionicModal.fromTemplateUrl('views/modals/txp-details.html', {
      scope: scope
    }).then(function(modal) {
      scope.showMultipleOutputs = {
        value: false
      };

      scope.showMultipleOutputsChange = function() {
        scope.showMultipleOutputs.value = !scope.showMultipleOutputs.value;
        scope.resizeView();
      };

      scope.resizeView = function() {
        $timeout(function() {
          $ionicScrollDelegate.resize();
        }, 10);
      };

      scope.txpDetailsModal = modal;
      scope.txpDetailsModal.show();
    });
  };

  return root;
});
