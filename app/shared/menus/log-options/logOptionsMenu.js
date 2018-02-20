'use strict';

angular.module('owsWalletApp.directives')
  .directive('logOptionsMenu', function(platformInfoService) {
    return {
      restrict: 'E',
      templateUrl: 'shared/menus/log-options/log-options.html',
      transclude: true,
      scope: {
        show: '=show',
        options: '=options',
        fillClass: '=fillClass',
        onSelect: '=onSelect',
        onCopy: '=onCopy',
        onSend: '=onSend'
      },
      link: function(scope, element, attrs) {
        scope.isCordova = platformInfoService.isCordova;

        scope.hide = function() {
          scope.show = false;
        };

        scope.getFillClass = function(index) {
          scope.onSelect(index);
        };
      }
    };
  });
