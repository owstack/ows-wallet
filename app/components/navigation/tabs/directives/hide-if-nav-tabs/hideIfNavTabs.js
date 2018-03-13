'use strict';

angular.module('owsWalletApp.directives')
.directive('hideIfNavTabs', function($rootScope) {
  return {
    restrict: 'A',
    priority: -1,
    link: function(scope, elem, attrs, ctrl) {
      if ($rootScope.usingTabs) {
        elem.addClass('ng-hide');
      } else {
        elem.removeClass('ng-hide');      	
      }
    }
  };
});
