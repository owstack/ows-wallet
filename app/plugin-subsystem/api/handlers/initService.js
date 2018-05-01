'use strict';

angular.module('owsWalletApp.pluginApi').service('initService', function(lodash, appletService) {

	var root = {};

  root.respond = function(message, callback) {
	  // Request parameters.
    var appletId = message.request.params.id;
    var serviceId = message.request.params.pluginId;

  	if (lodash.isUndefined(appletId) || appletId.length <= 0) {
	    message.response = {
	      statusCode: 400,
	      statusText: 'The request must include an applet id.',
	      data: {}
	    };
			return callback(message);
  	}

		// Get the applet.
		var applet = appletService.getAppletWithStateById(appletId);

		if (lodash.isUndefined(applet)) {
	    message.response = {
	      statusCode: 404,
	      statusText: 'Applet not found.',
	      data: {}
	    };
			return callback(message);
		}

		// Initialize the service on the applet (creates a service delegate).
		try {
			applet.initService(serviceId);

	    message.response = {
	      statusCode: 200,
	      statusText: 'OK',
	      data: {}
	    };
		} catch (ex) {

	    message.response = {
	      statusCode: 500,
	      statusText: ex.message,
	      data: {}
	    };
		}

		return callback(message);
	};

  return root;
});
