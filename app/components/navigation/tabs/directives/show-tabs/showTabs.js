'use strict';

angular.module('owsWalletApp.directives')
.directive('showTabs', function($rootScope, $timeout) {
  return {
    link: function(scope, elem, attrs, ctrl) {
      scope.$on("$ionicView.enter", function(event, data) {
        if (!attrs.showTabs || (attrs.showTabs == 'true')) {
          $rootScope.hideTabs = '';
        } else {
          $rootScope.hideTabs = 'tabs-item-hide';
        }
      });
    }
  };
});
