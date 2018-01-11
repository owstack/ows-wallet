'use strict';

angular.module('owsWalletApp.controllers').controller('preferencesWalletServiceUrlController',
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

    $scope.resetDefaultUrl = function() {
      $scope.walletServiceUrl.value = defaults.currencyNetworks[wallet.networkURI].walletService.url;
    };

    $scope.save = function() {
      var walletServiceEnvs = networkService.getNetworkByURI(wallet.networkURI).walletService;
      var walletService;
      switch ($scope.walletServiceUrl.value) {
        case 'prod':
        case 'production':
          walletService = walletServiceEnvs.production.url;
          break;
        case 'sta':
        case 'staging':
          walletService = walletServiceEnvs.staging.url;
          break;
        case 'loc':
        case 'local':
          walletService = walletServiceEnvs.local.url;
          break;
      };
      if (walletService) {
        $log.info('Using Wallet Service URL Alias to ' + walletService);
        $scope.walletServiceUrl.value = walletService;
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
