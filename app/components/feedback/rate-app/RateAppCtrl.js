'use strict';

angular.module('owsWalletApp.controllers').controller('RateAppCtrl', function($rootScope, $scope, $state, $stateParams, $window, $log, lodash, externalLinkService, platformInfoService, feedbackService, ongoingProcessService, configService, appConfig) {
  $scope.score = parseInt($stateParams.score);
  var isAndroid = platformInfoService.isAndroid;
  var isIOS = platformInfoService.isIOS;

  var config = configService.getSync();
  $scope.appName = appConfig.nameCase;
  
  $scope.skip = function() {
    var dataSrc = {
      "App": $scope.appName,
      "AppVersion": $window.version,
      "Platform": ionic.Platform.platform(),
      "DeviceVersion": ionic.Platform.version(),
      "Email": config.emailNotifications.email,
      "Feedback": ' ',
      "Score": $stateParams.score
    };

    feedbackService.send(dataSrc, function(err) {
      if (err) {
        // Try to send, but not essential, since the user didn't add a message.
        $log.warn('Could not send feedback.');
      }
    });

    $state.go($rootScope.sref('rate.complete'), {
      score: $stateParams.score,
      skipped: true
    });
  };

  $scope.sendFeedback = function() {
    $state.go($rootScope.sref('rate.send'), {
      score: $scope.score
    });
  };

  $scope.goAppStore = function() {
    var url;
    if (isAndroid) {
      url = appConfig.googleStoreUrl;
    } else if (isIOS) {
      url = appConfig.appleStoreUrl;
    }

    externalLinkService.open(url);
    $state.go($rootScope.sref('rate.complete'), {
      score: $stateParams.score,
      skipped: true,
      rated: true
    });
  };
});
