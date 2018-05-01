'use strict';

angular.module('owsWalletApp.controllers').controller('AppletsCtrl', function($scope, $timeout, $ionicScrollDelegate, appletService) {

  $scope.hide = false;

  $scope.toggle = function() {
    $scope.hide = !$scope.hide;
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);
  };

  $scope.openApplet = function(applet) {
    applet.open();
  };

});
