'use strict';

angular.module('owsWalletApp.directives')
.directive('hideTabs', function($rootScope, $timeout) {
  return {
    link: function(scope, elem, attrs, ctrl) {
      scope.$on("$ionicView.beforeEnter", function(event, data) {
        if (!attrs.hideTabs || (attrs.hideTabs == 'true')) {
          $rootScope.hideTabs = 'tabs-item-hide';
        } else {
          $rootScope.hideTabs = '';
        }
      });
    }
  };
});
