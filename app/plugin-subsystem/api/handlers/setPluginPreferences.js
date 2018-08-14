'use strict';

angular.module('owsWalletApp.pluginApi').service('setPluginPreferences', function(pluginService) {

	var root = {};

  root.respond = function(message, callback) {
    var pluginId = message.header.clientId;

	  // Request parameters.
    var prefs = message.request.data;

  	pluginService.setPluginPreferences(pluginId, prefs).then(function() {

	    message.response = {
	      statusCode: 200,
	      statusText: 'OK',
	      data: {}
	    };

			return callback(message);

  	}).catch(function(error) {

	    message.response = {
	      statusCode: 500,
	      statusText: 'UNEXPECTED_ERROR',
	      data: {
	      	message: error.message
	      }
	    };

			return callback(message);

  	});
	};

  return root;
});
