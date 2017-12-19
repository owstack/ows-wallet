'use strict';

angular.module('owsWalletApp.controllers').controller('tabSettingsController', function($rootScope, $timeout, $scope, appConfigService, $log, lodash, uxLanguage, platformInfo, profileService, feeService, configService, storageService, gettextCatalog) {

  var updateConfig = function() {
    $scope.currentLanguageName = uxLanguage.getCurrentLanguageName();
    $scope.wallets = profileService.getWallets();

    configService.whenAvailable(function(config) {
      $scope.unitName = config.wallet.settings.unitName;
      $scope.selectedAlternative = {
        name: config.wallet.settings.alternativeName,
        isoCode: config.wallet.settings.alternativeIsoCode
      };
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.isCordova = platformInfo.isCordova;
    $scope.isDevel = platformInfo.isDevel;
    $scope.appName = appConfigService.nameCase;
    configService.whenAvailable(function(config) {
      $scope.locked = config.lock && config.lock.method;
      if (!$scope.locked || $scope.locked == 'none')
        $scope.method = gettextCatalog.getString('Disabled');
      else
        $scope.method = $scope.locked.charAt(0).toUpperCase() + config.lock.method.slice(1);
    });
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    updateConfig();
  });

});
