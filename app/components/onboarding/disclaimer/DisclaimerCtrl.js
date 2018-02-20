'use strict';

angular.module('owsWalletApp.controllers').controller('DisclaimerCtrl', function($scope, $state, $log, $ionicConfig, $ionicNativeTransitions, profileService, uxLanguageService, $stateParams, startupService) {

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
    $scope.shrinkView = false;
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
        $state.go('tabs.home', {
          fromOnboarding: true
        });
      }
    });
  };

  $scope.toggleTerms = function() {
    $scope.shrinkView = !$scope.shrinkView;
  }

  $scope.goBack = function() {
    $ionicNativeTransitions.stateGo('onboarding.backup-request', {
      walletId: $stateParams.walletId
    }, {}, {
      type: 'slide',
      direction: 'right'
    });
  }

});
