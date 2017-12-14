'use strict';

angular.module('owsWalletApp.controllers').controller('backController', function($scope, $state, $stateParams) {

  $scope.importGoBack = function() {
    if ($stateParams.fromOnboarding) $state.go('onboarding.start');
    else $state.go('tabs.add');
  };

  $scope.onbaordingMailSkip = function() {
    $state.go('onboarding.backupRequest');
  }

});
