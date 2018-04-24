'use strict';

angular.module('owsWalletApp.controllers').controller('RateAppTipCtrl', function($rootScope, $scope, $state, $timeout, $log, gettextCatalog, platformInfoService, storageService, appConfig) {

  var isCordova = platformInfoService.isCordova;

  $scope.score = 0;
  $scope.appName = appConfig.nameCase;

  $scope.goFeedbackFlow = function() {
    $scope.hideTipRateApp();
    if (isCordova && $scope.score == 5) {
      $state.go($rootScope.sref('rate.rate-app'), {
        score: $scope.score
      });
    } else {
      $state.go($rootScope.sref('rate.send'), {
        score: $scope.score
      });
    }
  };

  $scope.setScore = function(score) {
    $scope.score = score;
    switch ($scope.score) {
      case 1:
        $scope.button_title = gettextCatalog.getString("I think it's terrible");
        break;
      case 2:
        $scope.button_title = gettextCatalog.getString("I don't like it");
        break;
      case 3:
        $scope.button_title = gettextCatalog.getString("It's alright");
        break;
      case 4:
        $scope.button_title = gettextCatalog.getString("I like it");
        break;
      case 5:
        $scope.button_title = gettextCatalog.getString("It's fantastic!");
        break;
    }
    $timeout(function() {
      $scope.$apply();
    });
  };

});
