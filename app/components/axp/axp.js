'use strict';

angular.module('owsWalletApp.controllers').controller('AxpCtrl', function($rootScope, $scope, $log, appletService) {

	var appletSessionId;

  $scope.$on("$ionicView.loaded", function(event, data) {
  	$rootScope.xshowTabs = data.stateParams.showTabs;
  	$rootScope.xshowTabs = 'false';
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
  	$rootScope.xshowTabs = data.stateParams.showTabs;
		// The extension point id for this controllers content.
		if (!data.stateParams.owsAxpId) {
			$log.error('Missing applet extension point id: cannot construct view');
			return;
		}
  	$scope.owsAxpId = data.stateParams.owsAxpId;

		if (!appletSessionId) {
			// Open the applet associated with the specified extension point (owsAxpId).
		  appletService.openApplet($scope.owsAxpId, function(session) {
		  	appletSessionId = session.id;
		  });
		} else {
		  appletService.enterApplet(appletSessionId);
		}
	});

  $scope.$on("$ionicView.afterLeave", function(event, data) {
	  appletService.leaveApplet(appletSessionId);
	});

});
