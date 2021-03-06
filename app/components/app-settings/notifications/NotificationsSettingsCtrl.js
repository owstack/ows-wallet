'use strict';

angular.module('owsWalletApp.controllers').controller('NotificationsSettingsCtrl', function($scope, $log, $timeout, appConfig, lodash, configService, platformInfoService, pushNotificationsService, emailService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    updateConfig();
  });

  function updateConfig() {
    var config = configService.getSync();
    $scope.appName = appConfig.nameCase;
    $scope.PNEnabledByUser = true;
    $scope.usePushNotifications = platformInfoService.isCordova;
    $scope.isIOSApp = platformInfoService.isIOS && platformInfoService.isCordova;

    $scope.pushNotifications = {
      value: config.pushNotificationsEnabled
    };

    var isConfirmedTxsNotificationsEnabled = config.confirmedTxsNotifications ? config.confirmedTxsNotifications.enabled : false;
    $scope.confirmedTxsNotifications = {
      value: isConfirmedTxsNotificationsEnabled
    };

    $scope.latestEmail = {
      value: emailService.getEmailIfEnabled()
    };

    $scope.newEmail = lodash.clone($scope.latestEmail);
    var isEmailEnabled = config.emailNotifications ? config.emailNotifications.enabled : false;

    $scope.emailNotifications = {
      value: isEmailEnabled && $scope.newEmail.value ? true : false
    };

    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.pushNotificationsChange = function() {
    if (!$scope.pushNotifications) return;
    var opts = {
      pushNotificationsEnabled: $scope.pushNotifications.value
    };
    configService.set(opts, function(err) {
      if (err) {
        $log.error(err);
      }
      if (opts.pushNotificationsEnabled) {
        pushNotificationsService.init();
      } else {
        pushNotificationsService.disable();
      }
    });
  };

  $scope.confirmedTxsNotificationsChange = function() {
    if (!$scope.pushNotifications) return;
    var opts = {
      confirmedTxsNotifications: {
        enabled: $scope.confirmedTxsNotifications.value
      }
    };
    configService.set(opts, function(err) {
      if (err) {
        $log.error(err);
      }
    });
  };

  $scope.emailNotificationsChange = function() {
    var opts = {
      enabled: $scope.emailNotifications.value,
      email: $scope.newEmail.value
    };

    $scope.latestEmail = {
      value: emailService.getEmailIfEnabled()
    };

    emailService.updateEmail(opts);
  };

  $scope.save = function() {
    emailService.updateEmail({
      enabled: $scope.emailNotifications.value,
      email: $scope.newEmail.value
    });

    $scope.latestEmail = {
      value: $scope.newEmail.value
    };

    $timeout(function() {
      $scope.$apply();
    });
  };

});
