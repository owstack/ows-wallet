'use strict';

angular.module('owsWalletApp.controllers').controller('StartCtrl', function($scope, $timeout, $ionicConfig, $log, profileService, startupService) {

  $scope.$on("$ionicView.afterEnter", function() {
    startupService.ready();
  });

  $scope.$on("$ionicView.enter", function() {
    $ionicConfig.views.swipeBackEnabled(false);
  });

  $scope.$on("$ionicView.beforeLeave", function() {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.createProfile = function() {
    profileService.createProfile(function(err) {
      if (err == 'EEXISTS') {
        $log.info('Using existing profile');
      } else {
        $log.error(err);
      }
    });
  };

});
