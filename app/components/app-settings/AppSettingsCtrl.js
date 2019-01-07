'use strict';

angular.module('owsWalletApp.controllers').controller('AppSettingsCtrl', function($timeout, $scope, appConfig, uxLanguageService, platformInfoService, profileService, configService, gettextCatalog, networkService, addressBookService, featureService) {

  var setScope = function() {
    $scope.isCordova = platformInfoService.isCordova;
    $scope.isDevel = platformInfoService.isDevel;
    $scope.appName = appConfig.nameCase;
    $scope.currentLanguageName = uxLanguageService.getCurrentLanguageName();
    $scope.wallets = profileService.getWallets();

    configService.whenAvailable(function(config) {
      addressBookService.list(function(err, ab) {
        if (!err) {
          $scope.addressbookEntryCount = Object.keys(ab).length;
        }
      });

      $scope.availableNetworks = networkService.getNetworks();
      $scope.pushNotificationsEnabled = config.pushNotificationsEnabled;

      $scope.unitCode = config.wallet.settings.unitCode;
      $scope.selectedAlternative = {
        name: config.wallet.settings.alternativeName,
        isoCode: config.wallet.settings.alternativeIsoCode
      };

      var locked = config.lock && config.lock.method;

      if (!locked || locked == 'none') {
        $scope.appLockMethod = gettextCatalog.getString('Disabled');
      } else {
        $scope.appLockMethod = config.lock.method.charAt(0).toUpperCase() + config.lock.method.slice(1);
      }
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    setScope();
  });

  $scope.$on("$ionicView.enter", function(event, data) {
//    setScope();
  });

});
