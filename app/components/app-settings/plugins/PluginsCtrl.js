'use strict';

angular.module('owsWalletApp.controllers').controller('PluginsCtrl', function($scope, lodash, pluginService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
	  $scope.plugins = lodash.sortBy(pluginService.getAppletsWithStateSync(), function(p) {
	  	return p.header.name;
	  });
	});

	$scope.toTitleCase = function(str) {
		return str.replace(/^[a-z]/, function(match) {
			return match.toUpperCase();
		})
	};

});
