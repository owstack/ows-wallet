'use strict';

angular.module('owsWalletApp.controllers').controller('WalletActionsCtrl', function($rootScope, $scope, $state, navigationService) {

  var self = this;
  // $scope inherited from parent.

  // Initialize buttons.
  self.buttonActionsDisabled = false;
  self.iconActionsDisabled = true;
  self.disabled = self.buttonActionsDisabled && self.iconActionsDisabled;

  // Actions disabled when header is collapsing.
  $scope.$watch('collapsibleItemPercent', function(newValue, oldValue) {
    if (newValue === undefined) {
      return;
    }
    self.buttonActionsDisabled = newValue < 0.99;
    self.iconActionsDisabled = newValue > 0.01;
    self.disabled = self.buttonActionsDisabled && self.iconActionsDisabled;
  });

  self.sendFrom = function() {
    if (self.disabled) {
      return;
    }
    if ($scope.hasBalance) {
      $state.go($rootScope.sref('send'), {
        walletId: $scope.walletId
      });
    }
  };

  self.receiveTo = function() {
    if (self.disabled) {
      return;
    }
    $state.go($rootScope.sref('receive'), {
      walletId: $scope.walletId
    });
  };

  self.settingsFor = function() {
    if (self.disabled) {
      return;
    }
    $state.transitionTo($rootScope.sref('preferences'), {
      walletId: $scope.walletId
    });
  };

});
