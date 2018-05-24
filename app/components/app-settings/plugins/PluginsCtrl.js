'use strict';

angular.module('owsWalletApp.controllers').controller('PluginsCtrl', function($scope, lodash, pluginService) {

  $scope.plugins = lodash.sortBy(pluginService.getPluginsWithStateSync(), function(p) {
  	return p.header.name;
  });

	$scope.toTitleCase = function(str) {
		return str.replace(/^[a-z]/, function(match) {
			return match.toUpperCase();
		})
	};

});
