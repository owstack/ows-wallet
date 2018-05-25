'use strict';

angular.module('owsWalletApp.controllers').controller('PluginDetailsCtrl', function($scope, lodash, pluginService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
  	var pluginId = data.stateParams.id;

  	// Filter on id only to return all installed versions of this plugin.
  	var filter = [{
  		key: 'header.id',
  		value: pluginId
  	}];

  	var plugins = pluginService.getPluginsWithStateSync(filter);
		$scope.plugin = plugins[0];

		var installedVersions = lodash.map(plugins, function(p) {
			return p.header.version;
		});

		$scope.versions = installedVersions;
		$scope.dependents = pluginService.getDependents(plugins);
		$scope.parents = pluginService.getParents(plugins);

  });

	$scope.toTitleCase = function(str) {
		return str.replace(/^[a-z]/, function(match) {
			return match.toUpperCase();
		})
	};

});
