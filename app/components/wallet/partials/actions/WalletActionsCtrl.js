'use strict';

angular.module('owsWalletApp.controllers').controller('WalletActionsCtrl', function($rootScope, $scope, $ionicNativeTransitions, navigationService) {

  var self = this;
  // $scope inherited from parent

  self.shouldShowActions = navigationService.usingSideMenu;
  
  self.sendFrom = function() {
    if ($scope.hasBalance) {
//      $state.go('tabs.send', {
    $ionicNativeTransitions.stateGo($rootScope.sref('send'), {
        walletId: $scope.walletId
    }, {}, {
      type: 'slide',
      direction: 'left'
    });
    }
  };

  self.receiveTo = function() {
//    $state.go('tabs.receive', {
    $ionicNativeTransitions.stateGo($rootScope.sref('receive'), {
      walletId: $scope.walletId
    }, {}, {
      type: 'slide',
      direction: 'left'
    });
  };

  self.settingsFor = function() {
/*
    $state.transitionTo($rootScope.sref('preferences'), {
      walletId: $scope.walletId
    });
*/
    $ionicNativeTransitions.stateGo($rootScope.sref('preferences'), {
      walletId: $scope.walletId
    }, {}, {
      type: 'slide',
      direction: 'left'
    });
  };

});
