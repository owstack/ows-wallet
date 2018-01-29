'use strict';

angular.module('owsWalletApp.controllers').controller('addressbookEntryController', function($rootScope, $scope, $state, $log, $timeout, $ionicHistory, $ionicNativeTransitions, lodash, addressbookService, popupService, gettextCatalog, networkService, profileService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    addressbookService.get(data.stateParams.id, function(err, entry) {
      if (err || !entry) {
        var title = gettextCatalog.getString('Error');
        var message = gettextCatalog.getString('Addressbook entry not found.');
        return popupService.showAlert(title, message, function() {
          $ionicHistory.goBack();
        });
      }

      $scope.addressbookEntry = entry;
    });
  });

  $scope.currencyFor = function(networkURI) {
    return networkService.parseCurrency(networkURI);
  };

  $scope.addressLabelFor = function(entryAddress) {
    return entryAddress.label || networkService.getNetworkByURI(entryAddress.networkURI).getFriendlyNetLabel();
  };

  $scope.sendTo = function() {
    $ionicHistory.removeBackView();
    $state.go('tabs.send');
    if (profileService.hasFunds()) {
      $timeout(function() {
        $state.transitionTo('tabs.send.amount', {
          networkURI: $scope.addressbookEntry.networkURI,
          toAddress: $scope.addressbookEntry.address,
          toName: $scope.addressbookEntry.name,
          toEmail: $scope.addressbookEntry.email
        });
      }, 100);
    }
  };

  $scope.edit = function() {
    $ionicNativeTransitions.stateGo('tabs.addressbook.edit', {
      id: $scope.addressbookEntry.id
    }, {}, {
      type: 'slide',
      direction: 'up'
    });
  };

});
