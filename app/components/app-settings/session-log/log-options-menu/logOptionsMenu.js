'use strict';

angular.module('owsWalletApp.directives').directive('logOptionsMenu', function(platformInfoService) {
  return {
    restrict: 'E',
    templateUrl: 'views/app-settings/session-log/log-options-menu/log-options-menu.html',
    transclude: true,
    scope: {
      show: '=show',
      options: '=options',
      fillClass: '=fillClass',
      onSelect: '=onSelect',
      onCopy: '=onCopy',
      onSend: '=onSend'
    },
    link: function(scope, element, attrs) {
      scope.isCordova = platformInfoService.isCordova;
      scope.hasTabs = (attrs.hasTabs != undefined || (attrs.hasTabs == 'true') ? true : false);

      scope.hide = function() {
        scope.show = false;
      };

      scope.getFillClass = function(index) {
        scope.onSelect(index);
      };
    }
  };
});
