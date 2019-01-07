'use strict';

angular.module('owsWalletApp.directives').directive('onLongPress', function($timeout) {
	return {
		restrict: 'A',
		link: function($scope, $elm, $attrs) {
			$elm.on('touchstart mousedown', startHandler);
			$elm.on('touchend mouseup', endHandler);

			function startHandler(event) {
				var duration = $attrs.longPressDuration || 1000; // milliseconds

				$scope.timer = $timeout(function() {
					// Apply the function given in on the element's on-long-press attribute.
					$scope.$apply(function() {
						$scope.$eval($attrs.onLongPress)
					});
				}, duration);
			};

			function endHandler(event) {
				// Prevent the onLongPress event from firing
				$timeout.cancel($scope.timer);

				// If there is an on-touch-end function attached to this element, apply it.
				if ($attrs.onTouchEnd) {
					$scope.$apply(function() {
						$scope.$eval($attrs.onTouchEnd)
					});
				}
			};
		}
	};
});
