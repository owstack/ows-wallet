'use strict';

angular.module('owsWalletApp.directives')
  .directive('sendOptionsMenu', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'shared/menus/send-options/send-options.html',
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
