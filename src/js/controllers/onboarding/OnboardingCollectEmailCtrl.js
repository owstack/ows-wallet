'use strict';

angular.module('owsWalletApp.controllers').controller('OnboardingCollectEmailCtrl', function($scope, $state, $log, $timeout, $window, $http, $httpParamSerializer, $ionicConfig, profileService, appConfigService, emailService) {

  var wallet;
  var walletId;
  $scope.data = {};
  $scope.author = appConfigService.author;

  // Get more info: https://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
  var _post = function(dataSrc) {
    return {
      method: 'POST',
      url: appConfigService.gappEmailCollectionUrl,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: $httpParamSerializer(dataSrc)
    };
  };

  $scope.$on("$ionicView.beforeLeave", function() {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.$on("$ionicView.enter", function() {
    $ionicConfig.views.swipeBackEnabled(false);
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    walletId = data.stateParams.walletId;
    wallet = profileService.getWallet(walletId);
    $scope.data.news = true;
  });

  var collectEmail = function() {
    var dataSrc = {
      "App": appConfigService.nameCase,
      "AppVersion": $window.version,
      "Platform": ionic.Platform.platform(),
      "DeviceVersion": ionic.Platform.version(),
      "Email": $scope.data.email,
      "News": $scope.data.news ? 'yes' : 'no'
    };

    $http(_post(dataSrc)).then(function() {
      $log.info("SUCCESS: Email collected");
    }, function(err) {
      $log.error("ERROR: Could not collect email");
    });
  };

  $scope.save = function() {
    $scope.disableButton = true;
    $timeout(function() {
      var enabled = true; // Set enabled email: true

      emailService.updateEmail({
        enabled: enabled,
        email: enabled ? $scope.data.email : null
      });
          
      collectEmail();

      $timeout(function() {
        $scope.goNextView();
      }, 200);
    }, 200);
  };

  $scope.goNextView = function() {
    $state.go('onboarding.backup-request', {
      walletId: walletId
    });
  };

  $scope.confirm = function(emailForm) {
    if (emailForm.$invalid) return;
    $scope.confirmation = true;
  };

  $scope.cancel = function() {
    $scope.confirmation = false;
    $timeout(function() {
      $scope.$digest();
    }, 1);
  };

});
