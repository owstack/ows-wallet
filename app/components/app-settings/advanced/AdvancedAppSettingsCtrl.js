'use strict';

angular.module('owsWalletApp.controllers').controller('AdvancedAppSettingsCtrl', function($scope, $log, configService, featureService) {

  var updateConfig = function() {
    var config = configService.getSync();

    $scope.spendUnconfirmed = {
      value: config.wallet.spendUnconfirmed
    };
    $scope.recentTransactionsEnabled = {
      value: config.recentTransactions.enabled
    };
    $scope.hideApplets = {
      value: config.hideApplets.enabled
    };
    $scope.showExperimentsMenu = {
      value: config.experiments.showMenu
    };
    $scope.useAdvancedKeypad = {
      value: config.advancedKeypad.enabled
    };
    $scope.availableFeatureLevels = featureService.getLevels();
    $scope.selectedFeatureLevel = {
      value: featureService.getLevel()
    }
  };

  $scope.spendUnconfirmedChange = function() {
    var opts = {
      wallet: {
        spendUnconfirmed: $scope.spendUnconfirmed.value
      }
    };
    configService.set(opts, function(err) {
      if (err) {
        $log.debug(err);
      }
    });
  };

  $scope.appletsChange = function() {
    var opts = {
      hideApplets: {
        enabled: $scope.hideApplets.value
      },
    };
    configService.set(opts, function(err) {
      if (err) {
        $log.debug(err);
      }
    });
  };

  $scope.recentTransactionsChange = function() {
    var opts = {
      recentTransactions: {
        enabled: $scope.recentTransactionsEnabled.value
      }
    };
    configService.set(opts, function(err) {
      if (err) {
        $log.debug(err);
      }
    });
  };

  $scope.featureLevelChange = function() {
    featureService.setLevel($scope.selectedFeatureLevel.value);
  };

  $scope.useAdvancedKeypadChange = function() {
    var opts = {
      advancedKeypad: {
        enabled: $scope.useAdvancedKeypad.value
      },
    };
    configService.set(opts, function(err) {
      if (err) {
        $log.debug(err);
      }
    });
  };

  $scope.toggleExperimentsMenu = function() {
    $scope.showExperimentsMenu.value = !$scope.showExperimentsMenu.value;

    var opts = {
      experiments: {
        showMenu: $scope.showExperimentsMenu.value
      }
    };
    configService.set(opts, function(err) {
      if (err) {
        $log.debug(err);
      }
      $log.info('Experiments menu ' + ($scope.showExperimentsMenu.value ? 'enabled' : 'disabled'));
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    updateConfig();
  });

});
