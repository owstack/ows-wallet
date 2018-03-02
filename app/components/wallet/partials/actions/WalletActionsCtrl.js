'use strict';

angular.module('owsWalletApp.controllers').controller('WalletActionsCtrl', function($rootScope, $scope, $state, navigationService) {

  var self = this;
  // $scope inherited from parent
  
  self.sendFrom = function() {
    if ($scope.hasBalance) {
    $state.go($rootScope.sref('send'), {
        walletId: $scope.walletId
    }, {}, {
      type: 'slide',
      direction: 'left'
    });
    }
  };

  self.receiveTo = function() {
    $state.go($rootScope.sref('receive'), {
      walletId: $scope.walletId
    }, {}, {
      type: 'slide',
      direction: 'left'
    });
  };

  self.settingsFor = function() {
    $state.transitionTo($rootScope.sref('preferences'), {
      walletId: $scope.walletId
    });
  };

});
