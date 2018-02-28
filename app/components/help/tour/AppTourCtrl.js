'use strict';
angular.module('owsWalletApp.controllers').controller('AppTourCtrl',
  function($rootScope, $scope, $state, $ionicModal, $location, $ionicScrollDelegate, helpService) {

    $scope.tourTopics = helpService.getTourTopics();

    $scope.slide = {
      index: 0,
      options: {
        loop: false,
        effect: 'slide',
        speed: 300,
        spaceBetween: 50
      }
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.fromOnboarding = data.stateParams.fromOnboarding;
    });

    $scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
      $scope.slider = data.slider;
    });

    $scope.$on("$ionicSlides.slideChangeStart", function(event, data) {
      $scope.slide.index = data.slider.activeIndex;
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {
    });

    $scope.goBack = function() {
      if ($scope.slide.index != 0) {
        $scope.slider.slidePrev();
      } else if ($scope.fromOnboarding) {
        $state.go($rootScope.sref('onboarding.start'));
      } else {
        $state.go($rootScope.sref('help'));
      }
    }

    $scope.learnMore = function() {
      var locationPrefix = helpService.tourLocationPrefix;
      var topicId = $scope.tourTopics[$scope.slide.index].helpTopicId;
      helpService.learnMore($scope, locationPrefix, topicId);
    };

    $scope.slideNext = function() {
      if ($scope.slide.index != $scope.tourTopics.length-1) {
        $scope.slider.slideNext();
      } else if ($scope.fromOnboarding) {
        $state.go($rootScope.sref('onboarding.create-first-wallet'));
      } else {
        $state.go($rootScope.sref('help'));
      }
    }

  });
