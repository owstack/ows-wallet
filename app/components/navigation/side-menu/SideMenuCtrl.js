'use strict';

angular.module('owsWalletApp.controllers').controller('SideMenuCtrl', function($rootScope, $scope, $timeout, $ionicSideMenuDelegate, $ionicHistory, platformInfoService) {

  $scope.toggleSideMenu = function() {
		// Scan view pushed for side menu open, hide video and display side menu.
		hideScanner();

    $ionicSideMenuDelegate.toggleLeft();
  };

  // Prevent the scanner from being shown before the side menu completes its close animation. We use a timeout
  // delay since there is not a good way to detect when animation is complete.
	$scope.$watch(function () {
    return $ionicSideMenuDelegate.isOpenLeft();
  }, function (isOpen) {  
    var currentState = $ionicHistory.currentStateName();
    if (currentState == $rootScope.sref('scan') && !isOpen) {
    	// Scan view displayed while side menu is closing. Wait for the side menu to close and then show the video.
			$timeout(function() {
				showScanner();
			}, 300);
    }
	});

	// Apply element styles to hide the scanner video. These styles reverse the operation of showScanner().
	function hideScanner() {
    angular.element(document.querySelector('#main-content-pane'))[0].style.backgroundColor = '#000';
    angular.element(document.querySelector('#side-menu-left'))[0].style.display = 'block';

    if (angular.element(document.querySelector('#scan'))[0]) {
	    angular.element(document.querySelector('#scan'))[0].style.backgroundColor = '#000';
    }		
	};

	// Apply element styles to show the scanner. Side menu scaffolding elements would normally prevent the scanner
	// video from being seen (video is behind these elements).
	function showScanner() {
    angular.element(document.querySelector('#main-content-pane'))[0].style.backgroundColor = 'transparent';
    angular.element(document.querySelector('#side-menu-left'))[0].style.display = 'none';

    if (angular.element(document.querySelector('#scan'))[0]) {
 	    angular.element(document.querySelector('#scan'))[0].style.backgroundColor = 'transparent';
 	  }
	};

});
