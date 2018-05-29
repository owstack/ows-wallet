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
    $log.debug('Creating profile');
    profileService.createProfile(function(err) {
      if (err) {
        $log.error(err);
      }
    });
  };

});
