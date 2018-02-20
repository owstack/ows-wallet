'use strict';

angular.module('owsWalletApp.controllers').controller('WalletServiceUrlSettingsCtrl',
  function($scope, $log, $stateParams, configService, applicationService, profileService, storageService, appConfigService, networkService, walletService) {

    var wallet = profileService.getWallet($stateParams.walletId);
    var walletId = wallet.credentials.walletId;
    var defaults = configService.getDefaults();

    $scope.wallet = wallet;
    $scope.appName = appConfigService.nameCase;
    $scope.success = null;

    $scope.walletServiceUrl = {
      value: walletService.getPreferences(walletId).walletServiceUrl || defaults.currencyNetworks[wallet.networkURI].walletService.url
    };

    $scope.customUrl = ($scope.walletServiceUrl.value != defaults.currencyNetworks[wallet.networkURI].walletService.url);

    $scope.$watch(
      "walletServiceUrl.value",
      function (newValue, oldValue) {
        $scope.customUrl = ($scope.walletServiceUrl.value != defaults.currencyNetworks[wallet.networkURI].walletService.url);
      }
    );

    $scope.resetDefaultUrl = function() {
      $scope.walletServiceUrl.value = defaults.currencyNetworks[wallet.networkURI].walletService.url;
    };

    $scope.save = function() {
      var walletServiceEnvs = networkService.getNetworkByURI(wallet.networkURI).walletService;
      var walletServiceUrl;
      switch ($scope.walletServiceUrl.value) {
        case 'prod':
        case 'production':
          walletServiceUrl = walletServiceEnvs.production.url;
          break;
        case 'sta':
        case 'staging':
          walletServiceUrl = walletServiceEnvs.staging.url;
          break;
        case 'loc':
        case 'local':
          walletServiceUrl = walletServiceEnvs.local.url;
          break;
      };
      if (walletServiceUrl) {
        $log.info('Using Wallet Service URL Alias to ' + walletServiceUrl);
        $scope.walletServiceUrl.value = walletServiceUrl;
      }

      walletService.setPreference(walletId, 'walletServiceUrl', $scope.walletServiceUrl.value, function(err) {
        if (err) {
          $log.debug(err);
        }
        storageService.setCleanAndScanAddresses(walletId, function() {
          applicationService.restart();
        });
      });
    };

  });
