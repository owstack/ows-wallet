'use strict';

angular.module('owsWalletApp.controllers').controller('DisclaimerCtrl', function($rootScope, $scope, $state, $log, $ionicConfig, $ionicModal, profileService, uxLanguageService, $stateParams, startupService) {

  $scope.$on("$ionicView.afterEnter", function() {
    startupService.ready();
  });

  $scope.$on("$ionicView.beforeEnter", function() {
    $scope.lang = uxLanguageService.currentLanguage;
    $scope.terms = {};
    $scope.accepted = {
      first: false,
      second: false,
      third: false
    };
    $scope.backedUp = ($stateParams.backedUp == 'false' ? false : true);
    $scope.resume = $stateParams.resume || false;
  });

  $scope.$on("$ionicView.enter", function() {
    if ($scope.backedUp || $scope.resume) {
      $ionicConfig.views.swipeBackEnabled(false);
    }
  });

  $scope.$on("$ionicView.beforeLeave", function() {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.confirm = function() {
    profileService.setDisclaimerAccepted(function(err) {
      if (err) {
        $log.error(err);
      } else {
        $state.go($rootScope.sref('home'), {
          fromOnboarding: true
        });
      }
    });
  };

  $scope.openTermsModal = function() {
    $ionicModal.fromTemplateUrl('views/onboarding/disclaimer/terms-of-use/terms-of-use.html', {
      scope: $scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      $scope.termsOfUseModal = modal;
      $scope.termsOfUseModal.show();
    });
  };

  $scope.goBack = function() {
    $state.go($rootScope.sref('onboarding.backup-request'), {
      walletId: $stateParams.walletId
    });
  }

});
