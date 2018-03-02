'use strict';

angular.module('owsWalletApp.controllers').controller('BackupWarningCtrl', function($rootScope, $scope, $timeout, $state, $stateParams, $ionicModal) {

  $scope.walletId = $stateParams.walletId;
  $scope.fromState = $stateParams.from == 'onboarding' ? $stateParams.from + '.backup-request' : $stateParams.from;
  $scope.toState = $stateParams.from + '.backup';

  $scope.openPopup = function() {
    $ionicModal.fromTemplateUrl('views/backup/screenshot-warning/screenshot-warning.html', {
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
        $state.go($rootScope.sref($scope.toState), {
          walletId: $scope.walletId
        }, {}, {
          type: 'slide',
          direction: 'right'
        });
      }, 200);
    };
  }

  $scope.goBack = function() {
    $state.go($rootScope.sref($scope.fromState), {
      walletId: $scope.walletId
    }, {}, {
      type: 'slide',
      direction: 'right'
    });
  };

});
