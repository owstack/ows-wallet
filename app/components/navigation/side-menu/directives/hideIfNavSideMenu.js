'use strict';

angular.module('owsWalletApp.directives').directive('hideIfNavSideMenu', function($rootScope) {
  return {
    restrict: 'A',
    priority: -1,
    link: function(scope, elem, attrs, ctrl) {
      if ($rootScope.usingSideMenu) {
        elem.addClass('ng-hide');
      } else {
        elem.removeClass('ng-hide');      	
      }
    }
  };
});
