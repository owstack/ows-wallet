'use strict';

angular.module('owsWalletApp.controllers').controller('CollectEmailCtrl', function($rootScope, $scope, $state, $log, $timeout, $window, $http, $httpParamSerializer, $ionicConfig, profileService, appConfig, emailService) {

  var walletId;

  $scope.$on("$ionicView.beforeLeave", function() {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.$on("$ionicView.enter", function() {
    $ionicConfig.views.swipeBackEnabled(false);
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    walletId = data.stateParams.walletId;
  });

  // Get more info: https://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
  var _post = function(dataSrc) {
    return {
      method: 'POST',
      url: appConfig.gappEmailCollectionUrl,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: $httpParamSerializer(dataSrc)
    };
  };

  var collectEmail = function(email, opts) {
    var dataSrc = {
      "App": appConfig.nameCase,
      "AppVersion": $window.version,
      "Platform": ionic.Platform.platform(),
      "DeviceVersion": ionic.Platform.version(),
      "Email": email,
      "News": opts.news ? 'yes' : 'no'
    };

    $http(_post(dataSrc)).then(function() {
      $log.info("Email address collected");
    }, function(err) {
      $log.warn("Could not collect email address");
    });
  };

  $scope.acceptEmail = function(email, opts) {
    opts = opts || {};
    $timeout(function() {
      emailService.updateEmail({
        enabled: true,
        email: email
      });
          
      collectEmail(email, opts);

      $timeout(function() {
        $scope.goNextView();
      }, 200);
    }, 200);
  };

  $scope.goNextView = function() {
    $state.go($rootScope.sref('onboarding.backup-request'), {
      walletId: walletId
    });
  };
});
