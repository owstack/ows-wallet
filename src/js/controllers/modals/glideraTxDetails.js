'use strict';

angular.module('owsWalletApp.controllers').controller('glideraTxDetailsController', function($scope) {

  $scope.cancel = function() {
    $scope.glideraTxDetailsModal.hide();
  };

});
