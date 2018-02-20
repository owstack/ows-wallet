'use strict';

angular.module('owsWalletApp.directives')
  .directive('actionSheet', function($rootScope, $timeout) {
    return {
      restrict: 'E',
      templateUrl: 'shared/directives/action-sheet/action-sheet.html',
      transclude: true,
      scope: {
        show: '=show',
      },
      link: function(scope, element, attrs) {
        scope.$watch('show', function() {
          if (scope.show) {
            $timeout(function() {
              scope.revealMenu = true;
            }, 100);
          } else {
            scope.revealMenu = false;
          }
        });
        scope.hide = function() {
          scope.show = false;
          $rootScope.$broadcast('incomingDataMenu.menuHidden');
        };
      }
    };
  });
