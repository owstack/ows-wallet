'use strict';

angular.module('owsWalletApp.directives')
  .directive('slideToAcceptSuccess', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'shared/directives/slide-to-accept-success/slide-to-accept-success.html',
      transclude: true,
      scope: {
        isShown: '=show',
        onConfirm: '&onConfirm',
        hideOnConfirm: '=hideOnConfirm'
      },
      link: function(scope, element, attrs) {
        var elm = element[0];
        elm.style.display = 'none';
        scope.$watch('isShown', function() {
          if (scope.isShown) {
            elm.style.display = 'flex';
            $timeout(function() {
              scope.fillScreen = true;
            }, 10);
          }
        });
        scope.onConfirmButtonClick = function() {
          scope.onConfirm();
          if (scope.hideOnConfirm) {
            scope.fillScreen = false;
            elm.style.display = 'none';
          }
        };
      }
    };
  });
