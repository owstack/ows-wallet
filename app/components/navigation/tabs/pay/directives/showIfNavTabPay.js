'use strict';

angular.module('owsWalletApp.directives').directive('showIfNavTabPay', function($rootScope) {
  return {
    restrict: 'A',
    priority: -1,
    link: function(scope, elem, attrs, ctrl) {
      if ($rootScope.usingTabPay) {
        elem.removeClass('ng-hide');
      } else {
        elem.addClass('ng-hide');      	
      }
    }
  };
});
