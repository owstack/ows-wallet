'use strict';

angular.module('owsWalletApp.controllers').controller('preferencesWalletServiceUrlController',
  function($scope, $log, $stateParams, configService, applicationService, profileService, storageService, appConfigService, networkService) {
    $scope.success = null;

    var wallet = profileService.getWallet($stateParams.walletId);
    $scope.wallet = wallet;

    var walletId = wallet.credentials.walletId;
    var defaults = configService.getDefaults();
    var config = configService.getSync();
    $scope.appName = appConfigService.nameCase;
    $scope.walletServiceUrl = {
      value: (config.walletServiceFor && config.walletServiceFor[walletId]) || defaults.currencyNetworks[wallet.network].walletService.url
    };

    $scope.resetDefaultUrl = function() {
      $scope.walletServiceUrl.value = defaults.currencyNetworks[wallet.network].walletService.url;
    };

    $scope.save = function() {
      var walletServiceEnvs = networkService.getNetworkByURI(wallet.network).walletService;
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

      var opts = {
        walletServiceFor: {}
      };
      opts.walletServiceFor[walletId] = $scope.walletServiceUrl.value;

      configService.set(opts, function(err) {
        if (err) $log.debug(err);
        storageService.setCleanAndScanAddresses(walletId, function() {
          applicationService.restart();
        });
      });
    };
  });
