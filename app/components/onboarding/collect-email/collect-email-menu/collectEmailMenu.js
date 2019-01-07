'use strict';

angular.module('owsWalletApp.directives').directive('collectEmailMenu', function(appConfig) {
  return {
    restrict: 'E',
    templateUrl: 'views/onboarding/collect-email/collect-email-menu/collect-email-menu.html',
    transclude: true,
    scope: {
      show: '=show',
      onAcceptEmail: '=onAcceptEmail'
    },
    link: function(scope, element, attrs) {
      scope.hasTabs = (attrs.hasTabs != undefined || (attrs.hasTabs == 'true') ? true : false);

      scope.hide = function() {
        scope.show = false;
      };

      scope.author = appConfig.author;
      scope.confirmation = false;
      scope.data = {
        news: true
      }

      scope.confirm = function(emailForm) {
        if (emailForm.$invalid) {
          return;
        }
        scope.confirmation = true;
      };

      scope.cancel = function() {
        scope.confirmation = false;
      };

      scope.save = function() {
        scope.disableButton = true;
        scope.onAcceptEmail(scope.data.email, {
          news: scope.data.news
        });
      };
    }
  };
});
