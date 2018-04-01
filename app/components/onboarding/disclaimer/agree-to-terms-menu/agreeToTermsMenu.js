'use strict';

angular.module('owsWalletApp.directives')
  .directive('agreeToTermsMenu', function() {
    return {
      restrict: 'E',
      templateUrl: 'views/onboarding/disclaimer/agree-to-terms-menu/agree-to-terms-menu.html',
      transclude: true,
      scope: {
        show: '=show',
        onOpenTerms: '=onOpenTerms',
        onConfirm: '=onConfirm'
      },
      link: function(scope, element, attrs) {
        scope.hasTabs = (attrs.hasTabs != undefined || (attrs.hasTabs == 'true') ? true : false);

        scope.hide = function() {
          scope.show = false;
        };

        scope.data = {
          termsAccepted: false
        };

        scope.openTerms = function() {
          scope.onOpenTerms();
        };

        scope.confirm = function() {
          scope.onConfirm();
        };
      }
    };
  });
