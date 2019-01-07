'use strict';

angular.module('owsWalletApp.directives').directive('gravatar', function(md5) {
  return {
    restrict: 'AE',
    replace: true,
    template: '<img class="gravatar" alt="{{ name }}" height="{{ height }}"  width="{{ width }}" src="https://secure.gravatar.com/avatar/{{ emailHash }}.jpg?s={{ width }}&d=mm">',
    scope: {
      name: '@',
      height: '@',
      width: '@',
      email: '@'
    },
    link: function(scope, el, attr) {
      function refresh() {
        scope.emailHash = md5.createHash(scope.email.toLowerCase() || '');
      }

      scope.$watch("email",function(newValue, oldValue) {
        refresh();
      });

      if (typeof scope.email === "string") {
        refresh();
      }
    }
  };
});
