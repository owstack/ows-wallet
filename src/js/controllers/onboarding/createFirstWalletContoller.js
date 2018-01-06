'use strict';
angular.module('owsWalletApp.controllers').controller('createFirstWalletController',
  function($scope, $state, $log, $timeout, $filter, ongoingProcess, profileService, popupService, gettextCatalog, configService, networkService, platformInfo) {

    $scope.isCordova = platformInfo.isCordova;
    var retryCount = 0;

    $scope.$on("$ionicView.enter", function(event, data) {
      var config = configService.getSync();
      $scope.data = {
        networkURI: config.currencyNetworks.default
      };
      $scope.availableNetworks = networkService.getLiveNetworks();
      $scope.network = networkService.getNetworkByURI($scope.data.networkURI);
    });

    $scope.$watch('data.networkURI', function(newValue, oldValue) {
      if (newValue && newValue != oldValue) {
        $scope.network = networkService.getNetworkByURI($scope.data.networkURI);
      }
    });

    $scope.createFirstWallet = function() {
      ongoingProcess.set('creatingWallet', true);
      $timeout(function() {
        profileService.createDefaultWallet($scope.data.networkURI, function(err, walletClient) {
          if (err) {
            $log.warn(err);

            return $timeout(function() {
              $log.warn('Retrying to create default wallet.....:' + ++retryCount);
              if (retryCount > 3) {
                ongoingProcess.set('creatingWallet', false);
                popupService.showAlert(
                  gettextCatalog.getString('Cannot Create Wallet'), err,
                  function() {
                    retryCount = 0;
                    return $scope.createFirstWallet();
                  }, gettextCatalog.getString('Retry'));
              } else {
                return $scope.createFirstWallet();
              }
            }, 2000);
          };
          ongoingProcess.set('creatingWallet', false);
          var wallet = walletClient;
          var walletId = wallet.credentials.walletId;

          $state.go('onboarding.collectEmail', {
            walletId: walletId
          });
        });
      }, 300);
    };
  });
