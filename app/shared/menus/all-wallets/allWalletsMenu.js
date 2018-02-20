'use strict';

angular.module('owsWalletApp.directives')
  .directive('allWalletsMenu', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'shared/menus/all-wallets/all-wallets.html',
      transclude: true,
      scope: {
        show: '=show',
        onSelectChooseFavorites: '=onSelectChooseFavorites'
      },
      link: function(scope, element, attrs) {
        scope.hide = function() {
          scope.show = false;
        };
      }
    };
  });
