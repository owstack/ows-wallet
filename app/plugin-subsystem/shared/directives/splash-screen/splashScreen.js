'use strict';

angular.module('owsWalletApp.pluginDirectives')
  .directive('splashScreen', function($timeout, lodash) {
    return {
      restrict: 'E',
      templateUrl: 'shared/directives/splash-screen/splash-screen.html',
      transclude: true,
      scope: {
        image: '=image',
        hide: '=?hide'
      },
      link: function(scope, element, attrs) {
        if (!scope.image) {
          return;
        }

        element.css({
          background: 'url(\'' + scope.image + '\')'
        });

        scope.$watch('hide', function() {
          programHide();
        });

        function programHide() {
          var delay = parseInt(scope.hide);
          delay = (lodash.isNaN(delay) ? -1 : delay);

          if (delay >= 0) {
            $timeout(function() {
              hideSplash();
            }, delay);
          }
        };

        function hideSplash() {
          element.on('animationend', removeSplash);
          element.addClass('animated fadeOut');

          function removeSplash() {
            element.addClass('ng-hide');
            element.removeClass('animated fadeOut');
            element.off('animationend', removeSplash);
          };
        };
      }
    };
  });
