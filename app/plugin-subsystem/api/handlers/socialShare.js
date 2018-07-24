'use strict';

angular.module('owsWalletApp.pluginApi').service('socialShare', function(lodash) {

	var root = {};

  root.respond = function(message, callback) {
	  // Request parameters.
    var data = message.request.data;

		var options = {
		  message: data.message || '',
		  subject: data.subject || '',
		  files: data.files || [],
		  url: data.url || '',
		  chooserTitle: data.chooserTitle || '', // Android only
		  appPackageName: data.appPackageName || '' // Android only
		};

		window.plugins.socialsharing.shareWithOptions(options, function(result) {
	    message.response = {
	      statusCode: 200,
	      statusText: 'OK',
	      data: {}
	    };

			return callback(message);

		}, function(error) {
	    message.response = {
	      statusCode: 500,
	      statusText: 'UNEXPECTED_ERROR',
	      data: {
	      	message: error
	      }
	    };

			return callback(message);

		});

	};

  return root;
});
