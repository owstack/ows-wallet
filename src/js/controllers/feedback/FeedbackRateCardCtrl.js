'use strict';

angular.module('owsWalletApp.controllers').controller('FeedbackRateCardCtrl', function($scope, $state, $timeout, $log, gettextCatalog, platformInfoService, storageService, appConfigService) {

  $scope.isCordova = platformInfoService.isCordova;
  $scope.score = 0;
  $scope.appName = appConfigService.nameCase;

  $scope.goFeedbackFlow = function() {
    $scope.hideCard();
    if ($scope.isCordova && $scope.score == 5) {
      $state.go('tabs.rate.rate-app', {
        score: $scope.score
      });
    } else {
      $state.go('tabs.rate.send', {
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

  $scope.hideCard = function() {
    $log.debug('Feedback card dismissed.')
    storageService.getFeedbackInfo(function(error, info) {
      var feedbackInfo = JSON.parse(info);
      feedbackInfo.sent = true;
      storageService.setFeedbackInfo(JSON.stringify(feedbackInfo), function() {
        $scope.showRateCard.value = false;
        $timeout(function() {
          $scope.$apply();
        }, 100);
      });
    });
  }

});
