'use strict';

angular.module('owsWalletApp.controllers').controller('NetworkSettingsCtrl', function($scope, lodash, networkService, configService, feeService, gettextCatalog, featureService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.networkName = data.stateParams.networkName;

    // Build a collection of the settings for each network
    $scope.availableNetworks = networkService.getNetworks();
    $scope.networkSettings = {};

    configService.whenAvailable(function(config) {
      lodash.forEach($scope.availableNetworks, function(n) {
        var feeChoices = feeService.getFeeChoices(n.name);

        $scope.networkSettings[n.name] = {};
        $scope.networkSettings[n.name].unitCode = config.networkPreferences[n.name].unitCode;
        $scope.networkSettings[n.name].currentFeeLevel = feeChoices[feeService.getCurrentFeeLevel(n.name)];
        $scope.networkSettings[n.name].label = n.shortLabel;

        $scope.networkSettings[n.name].selectedAlternative = {
          name: config.networkPreferences[n.name].alternativeName,
          isoCode: config.networkPreferences[n.name].alternativeIsoCode
        };
      });
    });

    if ($scope.networkName) {
      $scope.title = $scope.networkSettings[$scope.networkName].label;
    } else {
      $scope.title = gettextCatalog.getString('Currency Networks');
    }
  });

});
