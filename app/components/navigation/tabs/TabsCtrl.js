'use strict';

angular.module('owsWalletApp.controllers').controller('TabsCtrl', function($scope, $timeout) {

	// The scan tab displays video that has been inserted as the last child of the html tag. When switching away from the scan tab the new view
	// builds in behind the scan tab before the scan tab is hidden. Normally this is fine but the scan tab requires all of its ancestors to have
	// transparent background. This allows the new tab to be shown behind the scan overlay but on top of the video resulting in the scan overlay
	// being visble for a fraction of second over the new tab before being hidden. This is noticeable and looks bad. This function is called
	// before the tab switching starts and so here we modify the DOM to hide the scan overlay, allow the next digest cycle to complete (which
	// renders the new tab), and finally re-enable the scan overlay to be shown (next time the scan tab is selected). Additionally, fade-in
	// animation for the overaly helps smooth the view transition. Normally we could expect the ionic view event 'beforeLeave' to help but this
	// event gets fired too late in the cycle. This is a complete hack but it works.
  $scope.removeScanOverlay = function() {
  	var d = window.getComputedStyle(document.getElementsByClassName('scan-overlay')[0]).display;
		angular.element(document.querySelector('.scan-overlay'))[0].style.display = 'none';
		$timeout(function() {
			angular.element(document.querySelector('.scan-overlay'))[0].style.display = d;
		});
  };

});
