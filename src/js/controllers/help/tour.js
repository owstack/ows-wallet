'use strict';
angular.module('owsWalletApp.controllers').controller('tourController',
  function($scope, $state, $ionicModal, $location, $ionicScrollDelegate, helpService) {

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
        $state.go('onboarding.start');
      } else {
        $state.go('help');
      }
    }

    $scope.learnMore = function() {
      // Conveniently expand the help topic associated with this tour slide
      $scope.locationPrefix = helpService.tourLocationPrefix;
      $scope.topicId = $scope.tourTopics[$scope.slide.index].helpTopicId;

      $ionicModal.fromTemplateUrl('views/includes/learnMore.html', {
        scope: $scope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal) {
        $scope.learnMoreModal = modal;
        $scope.learnMoreModal.show();

        // Scroll to relavent help topic
        $location.hash($scope.locationPrefix + $scope.topicId);
        $ionicScrollDelegate.anchorScroll();
      });
    };

    $scope.closeLearnMoreModal = function() {
      $scope.learnMoreModal.remove();
    };

    $scope.slideNext = function() {
      if ($scope.slide.index != $scope.tourTopics.length-1) {
        $scope.slider.slideNext();
      } else if ($scope.fromOnboarding) {
        $state.go('onboarding.createFirstWallet');
      } else {
        $state.go('help');
      }
    }

  });
