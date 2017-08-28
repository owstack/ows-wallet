'use strict';

angular.module('owsWalletApp.controllers').controller('buyAndSellCardController', function($scope, nextStepsService, $ionicScrollDelegate, buyAndSellService) {

  $scope.services = buyAndSellService.getLinked();

  $scope.toggle = function() {
    $scope.hide = !$scope.hide;
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);
  };
});
