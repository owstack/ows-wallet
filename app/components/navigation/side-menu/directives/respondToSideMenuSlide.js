'use strict';

angular.module('owsWalletApp.directives').directive('respondToSideMenuSlide', function($timeout, $ionicSideMenuDelegate, platformInfoService) {
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
            // Remove status bar and add a 20px top offset.
            StatusBar.hide();
            ionic.requestAnimationFrame(function() {
              angular.element(document.querySelector('#main-content-nav-view'))[0].style.marginTop = '20px';
            });
          } else {
            // Add status bar and remove the top offset.
            StatusBar.show();
            ionic.requestAnimationFrame(function() {
              angular.element(document.querySelector('#main-content-nav-view'))[0].style.marginTop = '0';
            });
          }
        });
      }
      
    }
  }
});
