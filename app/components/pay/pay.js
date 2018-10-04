'use strict';

angular.module('owsWalletApp.controllers').controller('PayCtrl', function($scope, appletService) {

	var appletSessionId;

	// The extension point id for this controllers content.
	$scope.owsAxpId = 'ows-axp-tab-pay';

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
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
