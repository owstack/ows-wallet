'use strict';

angular.module('owsWalletApp.controllers').controller('AddressBookEntryCtrl', function($rootScope, $scope, $state, $log, $timeout, $ionicHistory, $ionicNativeTransitions, lodash, addressBookService, popupService, gettextCatalog, networkService, profileService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    addressBookService.get(data.stateParams.id, function(err, entry) {
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

  $scope.sendTo = function(index) {
    $ionicHistory.removeBackView();
    $state.go($rootScope.sref('send'));
    if (profileService.hasFunds()) {
      $timeout(function() {
        $state.transitionTo($rootScope.sref('send.amount'), {
          networkURI: $scope.addressbookEntry.addresses[index].networkURI,
          toAddress: $scope.addressbookEntry.addresses[index].address,
          toName: $scope.addressbookEntry.name + ($scope.addressbookEntry.addresses[index].label ? ' - ' + $scope.addressbookEntry.addresses[index].label : ''),
          toEmail: $scope.addressbookEntry.email,
          recipientType: 'contact'
        });
      }, 100);
    }
  };

  $scope.edit = function() {
    $ionicNativeTransitions.stateGo($rootScope.sref('address-book.edit'), {
//    $state.go($rootScope.sref('address-book.edit'), {
      id: $scope.addressbookEntry.id
    }, {}, {
      type: 'slide',
      direction: 'up'
    });
  };

});
