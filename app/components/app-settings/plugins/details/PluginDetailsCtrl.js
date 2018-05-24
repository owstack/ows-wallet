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

		$scope.parents = pluginService.getParentPlugins($scope.plugin, { ignoreVersion: true });
		$scope.dependents = pluginService.getDependentPlugins($scope.plugin, { ignoreVersion: true });

		$scope.toTitleCase = function(str) {
			return str.replace(/^[a-z]/, function(match) {
				return match.toUpperCase();
			})
		};

/*
		// Look at each installation of this plugin and get a list of it's parents an dependents.
		var listParents = [];
		var listDependents = [];
		lodash.forEach(plugins, function(plugin) {

			// Check for parents.
			var parents = pluginService.getParentPlugins(plugin);
			if (parents.length > 0) {
				// Get the names and versions of each parent.
				parents = lodash.map(parents, function(p) {
					return {
						name: p.header.name,
						version: p.header.version
					}
				});

				listParents.push({
					myVersion: plugin.header.version,
					plugins: parents
				});
			}

			// Check for dependents.
			var dependents = pluginService.getDependentPlugins(plugin);
			if (dependents.length > 0) {
				// Get the names and versions of each parent.
				dependents = lodash.map(dependents, function(d) {
					return {
						name: d.header.name,
						version: d.header.version
					}
				});

				listDependents.push({
					myVersion: plugin.header.version,
					plugins: dependents
				});
			}

		});

*/
  });

});
