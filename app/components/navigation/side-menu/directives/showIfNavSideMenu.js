'use strict';

angular.module('owsWalletApp.directives').directive('showIfNavSideMenu', function($rootScope) {
  return {
    restrict: 'A',
    priority: -1,
    link: function(scope, elem, attrs, ctrl) {
      if ($rootScope.usingSideMenu) {
        elem.removeClass('ng-hide');
      } else {
        elem.addClass('ng-hide');      	
      }
    }
  };
});
