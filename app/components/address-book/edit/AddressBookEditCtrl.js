'use strict';

angular.module('owsWalletApp.controllers').controller('AddressBookEditCtrl', function($rootScope, $scope, $state, $log, $timeout, $ionicModal, $ionicHistory, lodash, addressBookService, popupService, gettextCatalog, networkService) {

  $scope.form = {};
  $scope.showDeleteAddress = false;
  $scope.availableNetworks = networkService.getNetworks();

  var scanInProgress = false;
  var scanInProgressAddressIndex = null;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.from = data.stateParams.from;
    
    if (!scanInProgress) {
      if (data.stateParams && data.stateParams.id) {
        $scope.entryMode = 'edit';

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

      } else {
        $scope.entryMode = 'add';

        $scope.addressbookEntry = {
          // Use current time as a unique entry id.
          id: new Date().getTime(),
          name: '',
          email: '',
          addresses: [
          {
            address: data.stateParams.address || '',
            label: '',
            networkURI: data.stateParams.networkURI || ''
          }]
        };
      }
    }

    scanInProgress = false;
  });

  $scope.addressChanged = function(addressEntry) {
    var result = networkService.isValidAddress(addressEntry.address);
    if (result.isValid) {
      addressEntry.networkURI = result.network.getURI();
    } else {
      addressEntry.networkURI = undefined;      
    }
  };

  $scope.currencyFor = function(networkURI) {
    return networkService.parseCurrency(networkURI);
  };

  $scope.addAddress = function() {
    var newAddress = {
      address: '',
      label: '',
      networkURI: ''
    };
    $scope.addressbookEntry.addresses.push(newAddress);
  };

  $scope.onQrCodeScanFor = function(index) {
    scanInProgress = true;
    scanInProgressAddressIndex = index;
  };
  
  $scope.onQrCodeScanned = function(data) {
    $timeout(function() {
      if (data) {
        // Remove protocol if present
        var protocol = data.split(':')[0];
        data = data.replace(/^.*:/, '');

        // Set the address input value.
        var scanAddressFormInput = $scope.form.addressbookForm['dca' + scanInProgressAddressIndex];
        scanAddressFormInput.$setViewValue(data);
        scanAddressFormInput.$isValid = true;
        scanAddressFormInput.$render();
      }
      $scope.$digest();
    }, 100);
  };

  $scope.save = function(cb) {
    cb = cb || function(){};
    $timeout(function() {
      addressBookService.set($scope.addressbookEntry, function(err, ab) {
        if (err) {
          $log(err.message);
          popupService.showAlert(err.title, err.message);
          return cb(err);
        }
        return cb();
      });
    }, 100);
  };

  $scope.close = function(count) {
    count = count || -1;
    if ($scope.from == 'scan') {
      goScan(); 
    } else {
      $ionicHistory.goBack(count);
    }
  };

  $scope.done = function() {
    $scope.save(function(err) {
      if (!err) {
        $scope.close();
        $timeout(function() {
          $rootScope.$apply();
        }, 100);
      }
    });
  };

  function goScan() {
    $ionicHistory.goBack();
    $timeout(function() {
      $state.go($rootScope.sref('scan'));
    });
  };

  $scope.toggleDeleteAddressMode = function() {
    $scope.showDeleteAddress = !$scope.showDeleteAddress;
  }

  $scope.deleteAddress = function(index) {
    lodash.pullAt($scope.addressbookEntry.addresses, [index]);
    $scope.form.addressbookForm.$setDirty();

    if ($scope.addressbookEntry.addresses.length == 0) {
      $scope.showDeleteAddress = false;
    }
  };

  $scope.deleteContact = function() {
    var title = gettextCatalog.getString('Delete Contact');
    var message = gettextCatalog.getString('Are you sure you want to delete this contact?');
    popupService.showConfirm(title, message, null, null, function(result) {
      if (!result) {
        return cb();
      }

      doDelete(function(err) {
        if (!err) {
          $scope.close(-2);
        }
      });
    });
  };

  function doDelete(cb) {
    addressBookService.remove($scope.addressbookEntry.id, function(err, ab) {
      if (err) {
        popupService.showAlert(err.title, err.message);
        return cb(err);
      }
      return cb();
    });
  };

});
