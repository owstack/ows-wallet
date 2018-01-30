'use strict';

angular.module('owsWalletApp.directives')
  .directive('logOptions', function($timeout, platformInfo) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/logOptions.html',
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
        scope.isCordova = platformInfo.isCordova;

        scope.hide = function() {
          scope.show = false;
        };

        scope.getFillClass = function(index) {
          scope.onSelect(index);
        };
      }
    };
  });
