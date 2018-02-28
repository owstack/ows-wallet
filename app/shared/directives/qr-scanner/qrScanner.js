'use strict';

angular.module('owsWalletApp.directives')
  .directive('qrScanner', function($rootScope, $state, $log, $ionicHistory) {
    return {
      restrict: 'E',
      scope: {
        onScan: "&"
      },
      replace: true,
      template: '<a on-tap="chooseScanner()" nav-transition="none"><i class="icon ion-qr-scanner"></i></a>',
      link: function(scope, el, attrs) {

        scope.chooseScanner = function() {
          scope.openScanner();
        };

        scope.openScanner = function() {
          $log.debug('Opening scanner by directive...');
          $ionicHistory.nextViewOptions({
            disableAnimate: true
          });
          $state.go($rootScope.sref('scanner'), {
            passthroughMode: 1
          });
        };

        var afterEnter = $rootScope.$on('$ionicView.afterEnter', function() {
          if ($rootScope.scanResult) {
            scope.onScan({
              data: $rootScope.scanResult
            });
            $rootScope.scanResult = null;
          }
        });

        // Destroy event
        scope.$on('$destroy', function() {
          afterEnter();
        });
      }
    }
  });
