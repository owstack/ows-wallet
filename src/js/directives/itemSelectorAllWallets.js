'use strict';

angular.module('owsWalletApp.directives')
  .directive('itemSelectorAllWallets', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/itemSelectorAllWallets.html',
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
