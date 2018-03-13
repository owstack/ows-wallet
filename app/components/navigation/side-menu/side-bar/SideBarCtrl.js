'use strict';

angular.module('owsWalletApp.controllers').controller('SideBarCtrl', function($rootScope, $scope, $state, $timeout, $ionicHistory) {

  $rootScope.$on('Local/SideMenuBeforeEnter', function(e) {
    $scope.currentState = $rootScope.stateId($state.current.name);
  });

  $scope.goToState = function(stateName) {
  	$ionicHistory.clearHistory();
  	$ionicHistory.nextViewOptions({
  		historyRoot: true
  	});

  	// When going to the scan view we need to add a solid background to the scan view. 
  	// The side menu animation of a transparent scan view is unappealing.  The timeout gives the DOM time to update prior
  	// to the transition starting.  The background is removed by the side menu controller.
  	if (stateName == 'scan' && angular.element(document.querySelector('#scan'))[0]) {
	    angular.element(document.querySelector('#scan'))[0].style.backgroundColor = '#000';
		  $timeout(function() {
		  	$state.go($rootScope.sref(stateName));
		  });
	  } else {
		  $state.go($rootScope.sref(stateName));	  	
	  }

	  $scope.currentState = stateName;
  };

});
