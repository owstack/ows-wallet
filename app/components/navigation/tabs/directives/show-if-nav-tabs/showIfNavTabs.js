'use strict';

angular.module('owsWalletApp.directives').directive('showIfNavTabs', function($rootScope) {
  return {
    restrict: 'A',
    priority: -1,
    link: function(scope, elem, attrs, ctrl) {
      if ($rootScope.usingTabs) {
        elem.removeClass('ng-hide');
      } else {
        elem.addClass('ng-hide');      	
      }
    }
  };
});
