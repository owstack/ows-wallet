'use strict';

angular.module('owsWalletApp.directives')
  .directive('sendOptionsMenu', function() {
    return {
      restrict: 'E',
      templateUrl: 'shared/menus/send-options/send-options.html',
      transclude: true,
      scope: {
        show: '=show',
        onSelectSendMax: '=onSelectSendMax'
      },
      link: function(scope, element, attrs) {
        scope.hasTabs = (attrs.hasTabs != undefined || (attrs.hasTabs == 'true') ? true : false);

        scope.hide = function() {
          scope.show = false;
        };
      }
    };
  });
