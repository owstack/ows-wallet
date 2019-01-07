'use strict';

angular.module('owsWalletApp.controllers').controller('NetworkUnitSettingsCtrl', function($scope, $log, lodash, configService, $ionicHistory, gettextCatalog, walletService, profileService, networkService) {

  var config = configService.getSync();

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.networkName = data.stateParams.networkName;
    if (!$scope.networkName) {
      return;
    }

    var network = networkService.getNetworkByName($scope.networkName);
    $scope.unitList = lodash.filter(network.Unit().units, function(n) {
      return n.kind == 'standard' || n.kind == 'atomic';
    });

    $scope.currentUnit = config.networkPreferences[network.name].unitCode;
  });

  $scope.save = function(newUnit) {
    var opts = {
      networkPreferences: {}
    };

    opts.networkPreferences[$scope.networkName] = {
      unitCode: newUnit.code
    };

    configService.set(opts, function(err) {
      if (err) {
        $log.error(err);
      }

      $ionicHistory.goBack();
      walletService.updateRemotePreferences(profileService.getWallets());
    });
  };

});
