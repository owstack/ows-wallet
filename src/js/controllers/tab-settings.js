'use strict';

angular.module('owsWalletApp.controllers').controller('tabSettingsController', function($timeout, $scope, appConfigService, uxLanguage, platformInfo, profileService, configService, gettextCatalog, networkService, addressbookService) {

  var setScope = function() {
    $scope.isCordova = platformInfo.isCordova;
    $scope.isDevel = platformInfo.isDevel;
    $scope.appName = appConfigService.nameCase;
    $scope.currentLanguageName = uxLanguage.getCurrentLanguageName();
    $scope.wallets = profileService.getWallets();

    configService.whenAvailable(function(config) {
      addressbookService.list(function(err, ab) {
        if (!err) {
          $scope.addressbookEntryCount = Object.keys(ab).length;
        }
      });

      $scope.availableNetworks = networkService.getNetworks();
      $scope.pushNotificationsEnabled = config.pushNotificationsEnabled;

      $scope.unitName = config.wallet.settings.unitName;
      $scope.selectedAlternative = {
        name: config.wallet.settings.alternativeName,
        isoCode: config.wallet.settings.alternativeIsoCode
      };

      var locked = config.lock && config.lock.method;

      if (!locked || locked == 'none'){
        $scope.appLockMethod = gettextCatalog.getString('Disabled');
      } else {
        $scope.appLockMethod = $scope.locked.charAt(0).toUpperCase() + config.lock.method.slice(1);
      }
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    setScope();
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    setScope();
  });

});
