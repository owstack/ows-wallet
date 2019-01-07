'use strict';

angular.module('owsWalletApp.directives').directive('actionSheet', function($rootScope, $timeout) {
  return {
    restrict: 'E',
    templateUrl: 'shared/directives/action-sheet/action-sheet.html',
    transclude: true,
    scope: {
      show: '=show',
      hasTabs: '=hasTabs',
      closeOnBackdropClick: '=?closeOnBackdropClick'
    },
    link: function(scope, element, attrs) {
      scope.closeOnBackdropClick = angular.isDefined(scope.closeOnBackdropClick) ? scope.closeOnBackdropClick : true;

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
        if (scope.closeOnBackdropClick) {
          scope.show = false;
          $rootScope.$broadcast('incomingDataMenu.menuHidden');
        }
      };
    }
  };
});
