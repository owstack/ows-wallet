'use strict';

angular.module('owsWalletApp.directives')
  .directive('itemSelectorSendOptions', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/item-selector-send-options.html',
      transclude: true,
      scope: {
        show: '=show',
        onSelectSendMax: '=onSelectSendMax'
      },
      link: function(scope, element, attrs) {
        scope.hide = function() {
          scope.show = false;
        };
      }
    };
  });
