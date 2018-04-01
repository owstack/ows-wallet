'use strict';

angular.module('owsWalletApp.directives')
  .directive('allWalletsMenu', function() {
    return {
      restrict: 'E',
      templateUrl: 'views/home/layout/all-wallets-menu/all-wallets-menu.html',
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
