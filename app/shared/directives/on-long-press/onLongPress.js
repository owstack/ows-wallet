'use strict';

angular.module('owsWalletApp.directives')
	.directive('onLongPress', function($timeout) {
		return {
			restrict: 'A',
			link: function($scope, $elm, $attrs) {
				$elm.on('touchstart mousedown', startHandler);
				$elm.on('touchend mouseup', endHandler);

				function startHandler(event) {
					// Locally scoped variable that will keep track of the long press
					$scope.longPress = true;
					var duration = $attrs.longPressDuration || 1000; // milliseconds

					// We'll set a timeout for 600 ms for a long press
					$timeout(function() {
						if ($scope.longPress) {
							// If the touchend event hasn't fired,
							// apply the function given in on the element's on-long-press attribute
							$scope.$apply(function() {
								$scope.$eval($attrs.onLongPress)
							});
						}
					}, duration);
				};

				function endHandler(event) {
					// Prevent the onLongPress event from firing
					$scope.longPress = false;
					// If there is an on-touch-end function attached to this element, apply it
					if ($attrs.onTouchEnd) {
						$scope.$apply(function() {
							$scope.$eval($attrs.onTouchEnd)
						});
					}
				};
			}
		};
	});
