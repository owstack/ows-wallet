'use strict';

angular.module('owsWalletApp.controllers').controller('ProposalsCtrl',
  function($timeout, $scope, profileService, $log, txpModalService, addressBookService, timeService) {

    $scope.fetchingProposals = true;

    $scope.$on("$ionicView.enter", function(event, data) {
      addressBookService.list(function(err, ab) {
        if (err) {
          $log.error(err.message);
        }
        $scope.addressbook = ab || {};

        profileService.getTxps(50, function(err, txps) {
          $scope.fetchingProposals = false;
          if (err) {
            $log.error(err);
            return;
          }
          $scope.txps = txps;
          $timeout(function() {
            $scope.$apply();
          });
        });
      });
    });

    $scope.openTxpModal = txpModalService.open;

    $scope.createdWithinPastDay = function(time) {
      return timeService.withinPastDay(time);
    };
  });
