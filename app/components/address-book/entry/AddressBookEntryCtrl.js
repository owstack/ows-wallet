'use strict';

angular.module('owsWalletApp.controllers').controller('AddressBookEntryCtrl', function($rootScope, $scope, $state, $log, $timeout, $ionicHistory, lodash, addressBookService, popupService, gettextCatalog, networkService, profileService) {

  $scope.email = {
    subject: '',
    body: ''
  };

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

  $scope.currencyFor = function(networkName) {
    return networkService.getNetworkByName(networkName).currency;
  };

  $scope.addressLabelFor = function(entryAddress) {
    return entryAddress.label || networkService.getNetworkByName(entryAddress.networkName).shortLabel;
  };

  $scope.sendTo = function(index) {
    $ionicHistory.removeBackView();
    $state.go($rootScope.sref('send'));
    
    $timeout(function() {
      $state.transitionTo($rootScope.sref('send.amount'), {
        networkName: $scope.addressbookEntry.addresses[index].networkName,
        toAddress: $scope.addressbookEntry.addresses[index].address,
        toName: $scope.addressbookEntry.name + ($scope.addressbookEntry.addresses[index].label ? ' - ' + $scope.addressbookEntry.addresses[index].label : ''),
        toEmail: $scope.addressbookEntry.email,
        recipientType: 'contact'
      });
    }, 100);
  };

  $scope.edit = function() {
    $state.go($rootScope.sref('address-book.edit'), {
      id: $scope.addressbookEntry.id
    });
  };

});
