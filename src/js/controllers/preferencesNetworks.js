'use strict';

angular.module('owsWalletApp.controllers').controller('preferencesNetworksController',
  function($scope, lodash, networkService, configService, feeService, gettextCatalog) {

    $scope.availableNetworks = networkService.getNetworks();

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.networkURI = data.stateParams.networkURI;

      // Build a collection of the settings for each network
      $scope.networkSettings = {};

      configService.whenAvailable(function(config) {
        lodash.forEach($scope.availableNetworks, function(n) {
          var networkURI = n.getURI();
          var feeOpts = feeService.getFeeOpts(networkURI);

          $scope.networkSettings[networkURI] = {};
          $scope.networkSettings[networkURI].unitName = config.currencyNetworks[networkURI].unitName;;
          $scope.networkSettings[networkURI].currentFeeLevel = feeOpts[feeService.getCurrentFeeLevel(networkURI)];
          $scope.networkSettings[networkURI].label = n.getFriendlyNetLabel();
          $scope.networkSettings[networkURI].isLivenet = networkService.isLivenet(networkURI);

          $scope.networkSettings[networkURI].selectedAlternative = {
            name: config.currencyNetworks[networkURI].alternativeName,
            isoCode: config.currencyNetworks[networkURI].alternativeIsoCode
          };
        });
      });

      if ($scope.networkURI) {
        $scope.title = $scope.networkSettings[$scope.networkURI].label;
      } else {
        $scope.title = gettextCatalog.getString('Currency Networks');
      }
    });

  });
