'use strict';

angular.module('owsWalletApp.directives')
.directive('respondToSideMenuSlide', function($timeout, $ionicSideMenuDelegate, platformInfoService) {
  return {
    restrict: 'A',
    link: function($scope, $element, $attr) {

			// Apply element styles to hide the scanner video. These styles reverse the operation of showScanner().
			function hideScanner() {
		    angular.element(document.querySelector('#main-content-pane'))[0].style.backgroundColor = '#000';
		    angular.element(document.querySelector('#side-menu-left'))[0].style.display = 'block';

		    if (angular.element(document.querySelector('#scan'))[0]) {
			    angular.element(document.querySelector('#scan'))[0].style.backgroundColor = '#000';
		    }		
			};

      // Run in the next scope digest.
      $timeout(function() {

        $scope.$watch(function() {
          return $ionicSideMenuDelegate.getOpenRatio();
        }, function(ratio) {
        	// When the menu is in transition hide the scanner. This is only useful when side menu content dragging is enabled.
        	if (ratio > 0 && ratio <= 1) {
        		hideScanner();
        	}
        });

        var shouldHideStatusBar = !platformInfoService.isIPhoneX;

        if (platformInfoService.isCordova && shouldHideStatusBar) {
          $scope.$watch(function() {
            return $ionicSideMenuDelegate.isOpenLeft();
          }, function(isOpen) {
            if (isOpen) {
              StatusBar.hide();
            } else {
              StatusBar.show();      
            }
          });
        }

      });

    }
  }
});
