'use strict';

angular.module('owsWalletApp.controllers').controller('CreateFirstWalletCtrl',
  function($rootScope, $scope, $state, $log, $timeout, ongoingProcessService, profileService, popupService, gettextCatalog, configService, networkService, platformInfoService) {

    $scope.isCordova = platformInfoService.isCordova;
    var retryCount = 0;

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      var config = configService.getSync();
      $scope.data = {
        networkName: config.networkPreferences.defaultNetworkName
      };
      $scope.availableNetworks = networkService.getNetworks();
      $scope.network = networkService.getNetworkByName($scope.data.networkName);
    });

    $scope.$watch('data.networkName', function(newValue, oldValue) {
      if (newValue && newValue != oldValue) {
        $scope.network = networkService.getNetworkByName($scope.data.networkName);
      }
    });

    $scope.createFirstWallet = function() {
      ongoingProcessService.set('creatingWallet', true);
      $timeout(function() {
        profileService.createDefaultWallet($scope.data.networkName, function(err, walletClient) {
          if (err) {
            $log.error(err);

            return $timeout(function() {
              $log.info('Retrying to create default wallet.....:' + ++retryCount);
              if (retryCount > 3) {
                ongoingProcessService.set('creatingWallet', false);
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
          ongoingProcessService.set('creatingWallet', false);
          var wallet = walletClient;
          var walletId = wallet.credentials.walletId;

          $state.go($rootScope.sref('onboarding.collect-email'), {
            walletId: walletId
          });
        });
      }, 300);
    };
  });
