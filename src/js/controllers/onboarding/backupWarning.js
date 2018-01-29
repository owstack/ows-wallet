'use strict';

angular.module('owsWalletApp.controllers').controller('backupWarningController', function($scope, $ionicNativeTransitions, $timeout, $stateParams, $ionicModal) {

  $scope.walletId = $stateParams.walletId;
  $scope.fromState = $stateParams.from == 'onboarding' ? $stateParams.from + '.backupRequest' : $stateParams.from;
  $scope.toState = $stateParams.from + '.backup';

  $scope.openPopup = function() {
    $ionicModal.fromTemplateUrl('views/includes/screenshotWarningModal.html', {
      scope: $scope,
      backdropClickToClose: true,
      hardwareBackButtonClose: true
    }).then(function(modal) {
      $scope.warningModal = modal;
      $scope.warningModal.show();
    });

    $scope.close = function() {
      $scope.warningModal.remove();
      $timeout(function() {
        $ionicNativeTransitions.stateGo($scope.fromState, {
          walletId: $scope.walletId
        }, {}, {
          type: 'slide',
          direction: 'right'
        });
      }, 200);
    };
  }

  $scope.goBack = function() {
    $ionicNativeTransitions.stateGo($scope.fromState, {
      walletId: $scope.walletId
    }, {}, {
      type: 'slide',
      direction: 'right'
    });
  };

});
