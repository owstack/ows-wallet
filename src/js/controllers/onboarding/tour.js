'use strict';
angular.module('owsWalletApp.controllers').controller('tourController',
  function($scope, $state) {

    $scope.data = {
      index: 0
    };

    $scope.options = {
      loop: false,
      effect: 'flip',
      speed: 500,
      spaceBetween: 100
    }

    $scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
      $scope.slider = data.slider;
    });

    $scope.$on("$ionicSlides.slideChangeStart", function(event, data) {
      $scope.data.index = data.slider.activeIndex;
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {});

    $scope.goBack = function() {
      if ($scope.data.index != 0) $scope.slider.slidePrev();
      else $state.go('onboarding.start');
    }

    $scope.slideNext = function() {
      if ($scope.data.index != 5) $scope.slider.slideNext();
      else $state.go('onboarding.createFirstWallet');
    }
  });
