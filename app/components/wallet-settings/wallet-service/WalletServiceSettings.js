'use strict';

angular.module('owsWalletApp.controllers').controller('WalletServiceSettingsCtrl', function($scope, $log, $stateParams, lodash, configService, applicationService, gettextCatalog, profileService, storageService, appConfig, networkService, walletService) {

  var defaultConfig = configService.getDefaults();
  var wallet = profileService.getWallet($stateParams.walletId);
  var walletId = wallet.credentials.walletId;
  var walletPrefs = walletService.getPreferences(walletId);
  var defaultWalletService = defaultConfig.networkPreferences[wallet.networkName].walletService;

  $scope.form = {};
  $scope.wallet = wallet;
  $scope.appName = appConfig.nameCase;

  $scope.walletServiceName = {
    value: lodash.get(walletPrefs, 'walletService.name') || defaultWalletService.name
  };

  $scope.walletServiceUrl = {
    value: lodash.get(walletPrefs, 'walletService.url') || defaultWalletService.url
  };

  $scope.customUrl = ($scope.walletServiceUrl.value != defaultWalletService.url);

  $scope.$watchGroup(
    ['walletServiceName.value', 'walletServiceUrl.value'],
    function (newValue, oldValue) {
      $scope.customUrl =
        ($scope.walletServiceName.value != defaultWalletService.name) ||
        ($scope.walletServiceUrl.value != defaultWalletService.url);
    }
  );

  $scope.resetDefaultUrl = function() {
    $scope.walletServiceName.value = defaultWalletService.name;
    $scope.walletServiceUrl.value = defaultWalletService.url;
    $scope.form.urlForm.$setDirty();
  };

  $scope.save = function() {
    var ws = {
      name: $scope.walletServiceName.value,
      url: $scope.walletServiceUrl.value
    };

    walletService.setPreference(walletId, 'walletService', ws, function(err) {
      if (err) {
        $log.debug(err);
      }
      if ($scope.walletServiceUrl.value != defaultWalletService.url) {
        // Results in the wallet being read from the new server url.
        applicationService.restart();
      }
      $scope.form.urlForm.$setPristine();
    });
  };

});
