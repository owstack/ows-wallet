'use strict';

angular.module('owsWalletApp.directives')
  .directive('itemSelectorLogOptions', function(platformInfoService) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/log-options.html',
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
