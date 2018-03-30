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
        scope.hasTabs = (attrs.hasTabs != undefined || (attrs.hasTabs == 'true') ? true : false);

        scope.hide = function() {
          scope.show = false;
        };
      }
    };
  });
