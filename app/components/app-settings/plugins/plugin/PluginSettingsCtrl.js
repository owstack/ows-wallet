'use strict';

angular.module('owsWalletApp.controllers').controller('PluginSettingsCtrl', function($scope, lodash, pluginService, externalLinkService, gettextCatalog) {

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

	  $scope.externalLinks = {
	  	marketing: {
	  		itemName: gettextCatalog.getString('Learn More'),
	  		title: gettextCatalog.getString('Learn More'),
	  		message: gettextCatalog.getString('Visit the plugin authors website to learn more about this and other plugins.'),
		    okText: gettextCatalog.getString('Visit Website'),
		    cancelText: gettextCatalog.getString('Go Back'),
	  		url: $scope.plugin.header.url.marketing
	  	},
	  	support: {
	  		itemName: gettextCatalog.getString('Get Support'),
	  		title: gettextCatalog.getString('Get Support'),
	  		message: gettextCatalog.getString('You can get support for this plugin from ') + $scope.plugin.header.author,
		    okText: gettextCatalog.getString('Visit Website'),
		    cancelText: gettextCatalog.getString('Go Back'),
	  		url: $scope.plugin.header.url.support
	  	},
	  	privacy: {
	  		itemName: gettextCatalog.getString('Privacy Policy'),
	  		title: gettextCatalog.getString('View Privacy Policy'),
	  		message: gettextCatalog.getString('Read the privacy policy for this plugin.'),
		    okText: gettextCatalog.getString('Visit Website'),
		    cancelText: gettextCatalog.getString('Go Back'),
	  		url: $scope.plugin.header.url.privacy
	  	}
	  };

	  $scope.links = Object.keys($scope.externalLinks);
  });

  $scope.openExternalLink = function(which) {
    var optIn = true;
    externalLinkService.open(
    	$scope.externalLinks[which].url,
    	optIn,
    	$scope.externalLinks[which].title,
    	$scope.externalLinks[which].message,
    	$scope.externalLinks[which].okText,
    	$scope.externalLinks[which].cancelText);
  };

});
