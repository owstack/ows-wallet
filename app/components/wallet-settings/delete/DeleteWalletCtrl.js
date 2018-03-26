'use strict';

angular.module('owsWalletApp.controllers').controller('DeleteWalletCtrl',
  function($rootScope, $scope, $ionicHistory, gettextCatalog, lodash, profileService, $state, ongoingProcessService, popupService, pushNotificationsService) {

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      if (!data.stateParams || !data.stateParams.walletId) {
        popupService.showAlert(null, gettextCatalog.getString('No wallet selected.'), function() {
          $ionicHistory.goBack();
        });
        return;
      }
      $scope.wallet = profileService.getWallet(data.stateParams.walletId);
      if (!$scope.wallet) {
        popupService.showAlert(null, gettextCatalog.getString('No wallet found.'), function() {
          $ionicHistory.goBack();
        });
        return;
      }
      $scope.walletName = $scope.wallet.name;
    });

    $scope.showDeletePopup = function() {
      var title = gettextCatalog.getString('Warning!');
      var message = gettextCatalog.getString('Are you sure you want to delete this wallet?');
      popupService.showConfirm(title, message, null, null, function(res) {
        if (res) deleteWallet();
      });
    };

    function deleteWallet() {
      ongoingProcessService.set('deletingWallet', true);
      profileService.deleteWalletClient($scope.wallet, function(err) {
        ongoingProcessService.set('deletingWallet', false);
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err.message || err);
        } else {
          pushNotificationsService.unsubscribe($scope.wallet);
          $ionicHistory.nextViewOptions({
            disableAnimate: true,
            historyRoot: true
          });
          $ionicHistory.clearHistory();
          $state.go($rootScope.sref('settings')).then(function() {
            $state.transitionTo($rootScope.sref('home'));
          });
        }
      });
    };
  });
