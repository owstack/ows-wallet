'use strict';

angular.module('owsWalletApp.controllers').controller('tabSendController', function($scope, $rootScope, $log, $timeout, $ionicScrollDelegate, $ionicHistory, $ionicNativeTransitions, addressbookService, profileService, lodash, $state, walletService, incomingData, popupService, platformInfo, walletClientError, gettextCatalog, scannerService, networkService) {

  var originalList;
  var CONTACTS_SHOW_LIMIT;
  var currentContactsPage;

  var hasWallets = function() {
    $scope.wallets = profileService.getWallets({
      onlyComplete: true
    });
    $scope.hasWallets = lodash.isEmpty($scope.wallets) ? false : true;
  };

  // This is only to show the starter message, it does not have any other function
  var updateHasFunds = function() {
    $scope.hasFunds = profileService.hasFunds();
    $scope.checkingBalance = false;
  };

  var updateWalletsList = function() {
    $scope.showTransferCard = $scope.hasWallets;

    if ($scope.showTransferCard) {
      var walletsToTransfer = $scope.wallets;

      // If a sending walletId is specified then filter the transfer list by sending wallet network.
      if ($scope.walletId) {
        var sendingWallet = profileService.getWallet($scope.walletId);

        if (networkService.isTestnet(sendingWallet.networkURI)) {
          walletsToTransfer = lodash.filter(walletsToTransfer, function(w) {
            return networkService.isTestnet(w.network);
          });
        } else if (networkService.isTestnet(sendingWallet.networkURI)) {
          walletsToTransfer = lodash.filter(walletsToTransfer, function(w) {
            return networkService.isTestnet(w.network);
          });
        };
      }

      var walletList = [];
      lodash.each(walletsToTransfer, function(w) {
        walletList.push({
          networkURI: w.networkURI,
          color: w.color,
          name: w.name,
          recipientType: 'wallet',
          getAddress: function(cb) {
            walletService.getAddress(w, false, cb);
          },
        });
      });
      originalList = originalList.concat(walletList);
    }
  }

  var updateContactsList = function(cb) {
    addressbookService.list(function(err, ab) {
      if (err) {
        $log.error(err);
      }

      $scope.hasContacts = lodash.isEmpty(ab) ? false : true;
      if (!$scope.hasContacts) {
        return cb();
      }

      var sendingWallet = profileService.getWallet($scope.walletId);
      var completeContacts = [];

      lodash.each(ab, function(v, k) {
        // If a sending wallet is specified then filter the contact list by sending wallet network, else include all contacts.
        if (!sendingWallet || (sendingWallet && (sendingWallet.networkURI == v.networkURI))) {
          completeContacts.push({
            name: v.name,
            address: k,
            networkURI: v.networkURI,
            email: v.email,
            recipientType: 'contact',
            getAddress: function(cb) {
              return cb(null, k);
            },
          });
        }
      });

      var contacts = completeContacts.slice(0, (currentContactsPage + 1) * CONTACTS_SHOW_LIMIT);
      $scope.contactsShowMore = completeContacts.length > contacts.length;
      originalList = originalList.concat(contacts);
      return cb();
    });
  };

  var updateList = function() {
    $scope.list = lodash.clone(originalList);
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);
  };

  $scope.openScanner = function() {
    $state.go('tabs.scan');
  };

  $scope.showMore = function() {
    currentContactsPage++;
    updateWalletsList();
  };

  $scope.searchInFocus = function() {
    $scope.searchFocus = true;
  };

  $scope.searchBlurred = function() {
    if ($scope.formData.search == null || $scope.formData.search.length == 0) {
      $scope.searchFocus = false;
    }
  };

  $scope.findContact = function(search) {
    if (incomingData.redir(search)) {
      return;
    }

    if (!search || search.length < 2) {
      $scope.list = originalList;
      $timeout(function() {
        $scope.$apply();
      });
      return;
    }

    var result = lodash.filter(originalList, function(item) {
      var val = item.name;
      return lodash.includes(val.toLowerCase(), search.toLowerCase());
    });

    $scope.list = result;
  };

  $scope.goToAmount = function(item) {
    $timeout(function() {
      item.getAddress(function(err, addr) {
        if (err || !addr) {
          //Error is already formated
          return popupService.showAlert(err);
        }
        $log.debug('Got toAddress:' + addr + ' | ' + item.name);
        return $state.transitionTo('tabs.send.amount', {
          walletId: $scope.walletId,
          networkURI: item.networkURI,
          recipientType: item.recipientType,
          toAddress: addr,
          toName: item.name,
          toEmail: item.email,
          toColor: item.color
        })
      });
    });
  };

  $scope.goBackToWallet = function() {
    // Reset (clear) history in the send tab for subsequent deterministic navigation (results in
    // main settings view being shown when using tab bar).
    delete $ionicHistory.viewHistory().histories[$ionicHistory.currentHistoryId()];

    $ionicNativeTransitions.stateGo('tabs.wallet', {
      walletId: $scope.walletId
    }, {}, {
      type: 'slide',
      direction: 'right',
      duration: 200
    });
  };

  // This could probably be enhanced refactoring the routes abstract states
  $scope.createWallet = function() {
    $state.go('tabs.home').then(function() {
      $state.go('tabs.add.create-personal');
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.walletId = data.stateParams.walletId;
    $scope.showBackButton = ($scope.walletId ? true : false);
    $scope.hideTabs = !lodash.isEmpty(data.stateParams.walletId);

    $scope.checkingBalance = true;
    $scope.formData = {
      search: null
    };
    originalList = [];
    CONTACTS_SHOW_LIMIT = 10;
    currentContactsPage = 0;
    hasWallets();
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    if (!$scope.hasWallets) {
      $scope.checkingBalance = false;
      return;
    }
    updateHasFunds();
    updateWalletsList();
    updateContactsList(function() {
      updateList();
    });
  });
});
