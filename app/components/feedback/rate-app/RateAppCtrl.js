'use strict';

angular.module('owsWalletApp.controllers').controller('RateAppCtrl', function($scope, $state, $stateParams, $window, lodash, externalLinkService, platformInfoService, feedbackService, ongoingProcessService, configService, appConfigService) {
  $scope.score = parseInt($stateParams.score);
  var isAndroid = platformInfoService.isAndroid;
  var isIOS = platformInfoService.isIOS;

  var config = configService.getConfig();

  $scope.skip = function() {
    var dataSrc = {
      "App": appConfigService.nameCase,
      "AppVersion": $window.version,
      "Platform": ionic.Platform.platform(),
      "DeviceVersion": ionic.Platform.version(),
      "Email": config.emailNotifications.email,
      "Feedback": ' ',
      "Score": $stateParams.score
    };
    feedbackService.send(dataSrc, function(err) {
      if (err) {
        // try to send, but not essential, since the user didn't add a message
        $log.warn('Could not send feedback.');
      }
    });
    $state.go('tabs.rate.complete', {
      score: $stateParams.score,
      skipped: true
    });
  };

  $scope.sendFeedback = function() {
    $state.go('tabs.rate.send', {
      score: $scope.score
    });
  };

  $scope.goAppStore = function() {
    var url;
    if (isAndroid) {
      url = appConfigService.googleStoreUrl;
    } else if (isIOS) {
      url = appConfigService.appleStoreUrl;
    }

    externalLinkService.open(url);
    $state.go('tabs.rate.complete', {
      score: $stateParams.score,
      skipped: true,
      rated: true
    });
  };
});
