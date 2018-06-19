'use strict';

angular.module('owsWalletApp.pluginApi').service('getHostInfo', function(lodash, appConfig) {

	var root = {};

  root.respond = function(message, callback) {

    var safeProperties = [
      'version',
      'name',
      'nameNoSpace',
      'nameCase',
      'nameCaseNoSpace',
      'userVisibleName',
      'description',
      'author',
      'url',
      'downloadUrl',
      'appleStoreUrl',
      'googleStoreUrl',
      'supportEmail',
      'disclaimerUrl',
      'gitHubRepoUrl',
      'gitHubRepoBugs',
      'gitHubRepoApiLatestReleases'
    ];

    var info = lodash.pickBy(appConfig, function(value, key) {
      return safeProperties.indexOf(key) >= 0;
    });

    message.response = {
      statusCode: 200,
      statusText: 'OK',
      data: info
    };

		return callback(message);
	};

  return root;
});
